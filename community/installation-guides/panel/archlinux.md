# Archlinux
In this guide we will install Pterodactyl — including all of it's dependencies — and configure it
to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for Archlinux.
:::

## Install Requirements
We will first begin by installing [yay](https://github.com/Jguer/yay) to handle the installation of Pterodactyl's Panel ([from the Archlinux User Repos](https://aur.archlinux.org/packages/pterodactyl-daemon/) and it's dependencies.

### General Requirements
```bash
sudo pacman -S git base-devel
```

### Yay

```bash
git clone https://aur.archlinux.org/yay-git.git
cd yay-git
makepkg -scif
```

## Installing the Panel
```
yay -S pterodactyl-panel
```

## Server Configuration
Pterodactyl's Panel and it's [required](/panel/getting_started.md#dependencies) dependencies were installed by yay in the above command, but additional configuration is necessary to run the panel. This following section covers the configuration of parts of the server to run the panel.

### Enabling MariaDB
```bash
systemctl start mariadb
systemctl enable mariadb
```

### Configuring MariaDB
The fastest way to set up mariadb is to use the `mysql_secure_installation` command and follow prompts

```bash
mysql_secure_installation
```

The following are safe defaults.

Change to your own secure password  
`Set root password? [Y/n] Y`

Get rid of users that could access the db by default  
`Remove anonymous users? [Y/n] Y`

Keep root off the external interfaces  
`Disallow root login remotely? [Y/n] Y`

Extra databases that aren't needed  
`Remove test database and access to it? [Y/n] Y`

Clears and sets all the changes made  
`Reload privilege tables now? [Y/n] Y`

All done! If you've completed all of the above steps, your MariaDB installation should now be secure.

#### Adding MariaDB user

To add your first user to the database, see our tutorial on [setting up MySQL](/tutorials/mysql_setup.md).


### Setup PHP
The default php-fpm configuration is fine to use and can be started and then enabled on the system using the
commands below.

```bash
systemctl enable php-fpm
systemctl start php-fpm
```
php-fpm was installed as a dependancy of pterodactyl-panel

### Nginx
```bash
yay -S nginx
systemctl enable nginx
systemctl start nginx
```

A sample nginx configuration is provided by the pterodactyl-panel package. Copy (and symlink) it to the appropriate place as shown below
```bash
cp -b /var/www/pterodactyl/pterodactyl.conf /etc/nginx/sites-available/pterodactyl.conf
ln /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
```

Make sure that `/etc/nginx/nginx.conf` has the following line above the last bracket }
```
include sites-enabled/*;
```

Reload nginx
```
nginx -s reload
```

Please check our [tutorial](/tutorials/creating_ssl_certificates.md) on generating SSL certificates for more information.

#### SSL Configuration
<<< @/.snippets/webservers/nginx.conf{5,11,26-27}


### Redis
```bash
systemctl start redis
systemctl enable redis
```

The default Redis install is perfectly fine for the panel. If you have Redis already in use you may want to look into
[running another Redis instance](https://community.pivotal.io/s/article/How-to-setup-and-run-multiple-Redis-server-instances-on-a-Linux-host).

### Additional Utilities

#### Certbot
```bash
apt install -y certbot certbot-nginx
```

## Panel Setup
We need to configure some core aspects of the Panel.

A script has been provided by the pterodactyl-panel package at `/usr/bin/pterodactyl-panel` which provides a menu for completeing the following configurations.

These commands are assumed to be run as root from the installation directory (if not using the script)

Generate a new application encryption key:

``` bash
# Only run the command below if you are installing this Panel for
# the first time and do not have any Pterodactyl Panel data in the database.
php artisan key:generate --force
```

::: danger
Back up your encryption key (APP_KEY in the `.env` file). It is used as an encryption key for all data that needs to be stored securely (e.g. api keys).
Store it somewhere safe - not just on your server. If you lose it, all encrypted data is useless and can't be restored, even if you have database backups.
:::

### Environment Configuration
Pterodactyl's core environment is easily configured using a few different CLI commands built into the app. This step
will cover setting up things such as sessions, caching, database credentials, and email sending.

``` bash
php artisan p:environment:setup
php artisan p:environment:database

# To use PHP's internal mail sending (not recommended), select "mail". To use a
# custom SMTP server, select "smtp".
php artisan p:environment:mail
```

### Database Setup
Now we need to setup all of the base data for the Panel in the database you created earlier. **The command below
may take some time to run depending on your machine. Please _DO NOT_ exit the process until it is completed!** This
command will setup the database tables and then add all of the Nests & Eggs that power Pterodactyl.

``` bash
php artisan migrate --seed
```

### Add The First User
You'll then need to create an administrative user so that you can log into the panel. To do so, run the command below.
At this time passwords **must** meet the following requirements: 8 characters, mixed case, at least one number.

``` bash
php artisan p:user:make
```

## Queue Listeners
We make use of queues to make the application faster and handle sending emails and other actions in the background.
You will need to setup the queue worker for these actions to be processed.

### Crontab Configuration
The first thing we need to do is create a new cronjob that runs every minute to process specific Pterodactyl tasks, such
as session cleanup and sending scheduled tasks to daemons. You'll want to open your crontab using `sudo crontab -e` and
then paste the line below.

```bash
* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1
```

### Enable Queue Worker
Next you need to enable a new systemd worker to keep our queue process running in the background. This queue is responsible
for sending emails and handling many other background tasks for Pterodactyl.

A file called `pteroq.service` has been included in `/etc/systemd/system` by the installed pterodactyl-panel package with the appropriate systemd configuration.

Finally, enable and start the service:

``` bash
sudo systemctl enable --now pteroq.service
```

View the panel (with the included default configuration) on 127.0.0.1
