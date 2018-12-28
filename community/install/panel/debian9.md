# Install pterodactyl on Debian 9

This guide covers the installation of the requirements for a panel with SSL enabled.

[[toc]]

## Install Requirements

The panel requirements can be found [here](/panel/getting_started.md#dependencies)

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

### PHP 7.2

```bash
## Install the PHP 7.2 repo for debian
apt install -y ca-certificates apt-transport-https
wget -q https://packages.sury.org/php/apt.gpg -O- | apt-key add -
echo "deb https://packages.sury.org/php/ stretch main" | tee /etc/apt/sources.list.d/php.list

## Get apt updates
apt update

## Install PHP 7.2
apt install -y php7.2 php7.2-cli php7.2-gd php7.2-mysql php7.2-pdo php7.2-mbstring php7.2-tokenizer php7.2-bcmath php7.2-xml php7.2-fpm php7.2-curl php7.2-zip
```

### nginx

```bash
apt install -y nginx
```

### Redis

```bash
apt install -y redis-server

systemctl start redis-server
systemctl enable redis-server
```

### utilities

#### certbot
```bash
apt install -y certbot curl
```

#### composer
```bash
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

## Server Configuration

This following section covers the configuration of parts of the server to run the panel.

### MariaDB
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

All done! If you've completed all of the above steps, your MariaDB  
installation should now be secure.

#### Adding MariaDB user
We have a tutorial in the tutorial section  
[Setting up MySQL](/tutorials/mysql_setup.md)

### PHP

The default php-fpm configuration is good to use.

Start and enable php-fpm on the system.
```bash
systemctl enable php7.2-fpm
systemctl start php7.2-fpm
```

### nginx

follow the [tutorial](/tutorials/creating_ssl_certificates.md) on generating an SSL cert to use.

#### ssl config
<<< @/.snippets/webservers/nginx.conf{5,11,26-27}


### Redis
The default Redis install is perfectly fine for the panel.

If you have Redis already in use you may want to look into running another Redis instance similar to [this guide](https://community.pivotal.io/s/article/How-to-setup-and-run-multiple-Redis-server-instances-on-a-Linux-host)

## Installing the panel
Follow the regular guide to install the [panel](/panel/getting_started.md#installation)