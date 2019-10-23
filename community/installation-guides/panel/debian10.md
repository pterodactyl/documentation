# Debian 10
In this guide we will install Pterodactyl — including all of it's dependencies — and configure our webserver
to serve it using SSL.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/getting_started.md) but is tailored specifically for Debian 9.
:::

## Install Requirements
We will first begin by installing all of Pterodactyl's [required](/panel/getting_started.md#dependencies) dependencies.

### MariaDB
```bash
apt install -y software-properties-common dirmngr

## get MariaDB gpg keys
apt-key adv --recv-keys --keyserver hkp://keyserver.ubuntu.com:80 0xF1656F24C74CD1D8

## install the MariaDB repo
add-apt-repository 'deb [arch=amd64,i386,ppc64el] http://mirror.jaleco.com/mariadb/repo/10.1/debian stretch main'

## Get apt updates
apt update

## Install MariaDB 10.1
apt install -y mariadb-common mariadb-server mariadb-client

## Start maraidb
systemctl start mariadb
systemctl enable mariadb
```

### PHP 7.3
```bash
## Install the PHP 7.3 repo for debian
apt install -y ca-certificates apt-transport-https
wget -q https://packages.sury.org/php/apt.gpg -O- | apt-key add -
sh -c 'echo "deb https://packages.sury.org/php/ buster main" > /etc/apt/sources.list.d/php.list'

## Get apt updates
apt update

## Install PHP 7.3
apt install -y php7.3 php7.3-cli php7.3-gd php7.3-mysql php7.3-pdo php7.3-mbstring php7.3-tokenizer php7.3-bcmath php7.3-xml php7.3-fpm php7.3-curl php7.3-zip
```

### Nginx
```bash
apt install -y nginx
```

### Redis
```bash
apt install -y redis-server

systemctl start redis-server
systemctl enable redis-server
```

### Additional Utilities

#### Certbot
```bash
apt install -y certbot curl
```

#### Composer
```bash
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

## Server Configuration
This following section covers the configuration of parts of the server to run the panel.

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
systemctl enable php7.3-fpm
systemctl start php7.3-fpm
```

### Nginx
Please check our [tutorial](/tutorials/creating_ssl_certificates.md) on generating SSL certificates for more information.

#### SSL Configuration
<<< @/.snippets/webservers/nginx.conf{5,11,26-27}


### Redis Setup
The default Redis install is perfectly fine for the panel. If you have Redis already in use you may want to look into
[running another Redis instance](https://community.pivotal.io/s/article/How-to-setup-and-run-multiple-Redis-server-instances-on-a-Linux-host).

## Installing the Panel
Excellent, we now have all of the required dependencies installed and configured. From here, follow the [official Panel installation documentation](/panel/getting_started.md#download-files).
