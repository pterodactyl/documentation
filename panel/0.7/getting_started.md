# Getting Started

::: danger This Version is End-of-Life
This documentation is for **end-of-life software** which does not recieve any security updates or support
from the community. This documentation has been left accessible for historial reasons.

You should be installing and using [Pterodactyl Panel 1.0](/panel/1.0/getting_started.md) in production environments.
:::

Pterodactyl Panel is designed to run on your own web server. You will need to have root access to your server in order
to run and use this panel.

This panel does not exist as a drag-and-drop service to run your servers. It is a highly complex system
requiring multiple dependencies and administrators willing to spend some time learning how to use it. If you expect
to be able to install this with no understanding of basic Linux system administration you should stop and turn
around now.

[[toc]]

## Picking a Server OS
Pterodactyl runs on a wide range of operating systems, so pick whichever you are most comfortable using.

::: warning
Pterodactyl does not support most OpenVZ systems due to incompatabilities with Docker. If you are planning on running
this software on an OpenVZ based system you will &mdash; most likely &mdash; not be successful.
:::

| Operating System | Version | Supported | Notes |
| ---------------- | ------- | :-------: | ----- |
| **Ubuntu** | 18.04 | :white_check_mark: | Documentation written assuming Ubuntu 18.04 as the base OS. |
| | [20.04](/community/installation-guides/panel/ubuntu2004.html) | :white_check_mark: | |
| **CentOS** | [7](/community/installation-guides/panel/centos7.html) | :white_check_mark: | Extra repos are required. |
| | [8](/community/installation-guides/panel/centos8.html) | :white_check_mark: | All required packages are part of the base repos. |
| **Debian** | [9](/community/installation-guides/panel/debian9.html) | :white_check_mark: | Extra repos are required. |
| | [10](/community/installation-guides/panel/debian10.html) | :white_check_mark: | All required packages are part of the base repos. |

## Dependencies
* PHP `7.2` with the following extensions: `cli`, `openssl`, `gd`, `mysql`, `PDO`, `mbstring`, `tokenizer`, `bcmath`, `xml` or `dom`, `curl`, `zip`, and `fpm` if you are planning to use nginx
* MySQL `5.7` **or** MariaDB `10.1.3` or higher
* Redis (`redis-server`)
* A webserver (Apache, NGINX, Caddy, etc.)
* `curl`
* `tar`
* `unzip`
* `git`
* `composer`

### Example Dependency Installation
The commands below are simply an example of how you might install these dependencies. Please consult with your
operating system's package manager to determine the correct packages to install.

``` bash
# Add "add-apt-repository" command
apt -y install software-properties-common curl

# Add additional repositories for PHP, Redis, and MariaDB
LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
add-apt-repository -y ppa:chris-lea/redis-server
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash

# Update repositories list
apt update

# Add universe repository if you are on Ubuntu 18.04
apt-add-repository universe

# Install Dependencies
apt -y install php7.2 php7.2-cli php7.2-gd php7.2-mysql php7.2-pdo php7.2-mbstring php7.2-tokenizer php7.2-bcmath php7.2-xml php7.2-fpm php7.2-curl php7.2-zip mariadb-server nginx tar unzip git redis-server
```

### Installing Composer
Composer is a dependency manager for PHP that allows us to ship everything you'll need code wise to operate the Panel. You'll
need composer installed before continuing in this process.

``` bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer --1
```

## Download Files
The first step in this process is to create the folder where the panel will live and then move ourselves into that
newly created folder. Below is an example of how to perform this operation.

``` bash
mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl
```

Once you have created a new directory for the Panel and moved into it you'll need to download the Panel files. This
is as simple as using `curl` to download our pre-packaged content. Once it is downloaded you'll need to unpack the archive
and then set the correct permissions on the `storage/` and `bootstrap/cache/` directories. These directories
allow us to store files as well as keep a speedy cache available to reduce load times.

``` bash
curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/download/v0.7.19/panel.tar.gz
tar --strip-components=1 -xzvf panel.tar.gz
chmod -R 755 storage/* bootstrap/cache/
```

## Installation
::: danger This Version is End-of-Life
This documentation is for **end-of-life software** which does not recieve any security updates or support
from the community. This documentation has been left accessible for historial reasons.

You should be installing and using [Pterodactyl Panel 1.0](/panel/1.0/getting_started.md) in production environments.
:::

Now that all of the files have been downloaded we need to configure some core aspects of the Panel.

::: tip Database Configuration
You will need a database setup and a user with the correct permissions created for that database before
continuing any further. See below to quickly create a user and database for your Pterodactyl panel, if you are unsure how to do this or want more information, please have a look at [Setting up MySQL](/tutorials/mysql_setup.html).
```
$ mysql -u root -p

mysql> CREATE USER 'pterodactyl'@'localhost' IDENTIFIED WITH mysql_native_password BY 'A secure password';
mysql> CREATE DATABASE panel;
mysql> GRANT ALL ON panel.* TO 'pterodactyl'@'localhost' WITH GRANT OPTION;

```
:::

First we will copy over our default environment settings file, install core dependencies, and then generate a
new application encryption key.

``` bash
cp .env.example .env
composer install --no-dev --optimize-autoloader

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

### Set Permissions
The last step in the installation process is to set the correct permissions on the Panel files so that the webserver can
use them correctly.

``` bash
# If using NGINX or Apache (not on CentOS):
chown -R www-data:www-data * 

# If using NGINX on CentOS:
chown -R nginx:nginx *

# If using Apache on CentOS
chown -R apache:apache *
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

### Create Queue Worker
Next you need to create a new systemd worker to keep our queue process running in the background. This queue is responsible
for sending emails and handling many other background tasks for Pterodactyl.

Create a file called `pteroq.service` in `/etc/systemd/system` with the contents below.
``` text
# Pterodactyl Queue Worker File
# ----------------------------------

[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
# On some systems the user and group might be different.
# Some systems use `apache` or `nginx` as the user and group.
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

::: tip Redis on CentOS
If you are using CentOS, you will need to replace `redis-server.service` with `redis.service` at the `After=` line in order to ensure `redis` starts before the queue worker.
:::

::: tip
If you are not using `redis` for anything you should remove the `After=` line, otherwise you will encounter errors
when the service starts.
:::

If you are are using redis for your system, you will want to make sure to enable that it will start on boot. You can do that by running the following command: 
```bash
sudo systemctl enable --now redis-server
```

Finally, enable the service and set it to boot on machine start.

``` bash
sudo systemctl enable --now pteroq.service
```

#### Next Step: [Webserver Configuration](./webserver_configuration)
