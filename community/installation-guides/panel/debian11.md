# Debian 11
In this guide we will install Pterodactyl v1.X — including all of it's dependencies

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/1.0/getting_started.md) but is tailored specifically for Debian 11.
:::

## Install Requirements
```bash
apt -y install software-properties-common curl ca-certificates gnupg lsb-release sudo
```

### php 8.1
```bash
# Add repository for PHP
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list

wget -qO - https://packages.sury.org/php/apt.gpg | sudo apt-key add -

apt update

apt -y install php8.1 php8.1-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip} 
``` 

### MariaDB
```bash
# MariaDB repo setup script
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash
```

### redis
```bash
#Add repository for redis
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

apt-get update

apt-get install -y redis-server
```

### Get apt updates
```bash
# Update repositories list
apt update
```

### Install Dependencies
```bash
apt install -y mariadb-server nginx tar unzip git 
```

### Installing Composer

Composer is a dependency manager for PHP that allows us to ship everything you'll need code wise to operate the Panel. You'll
need composer installed before continuing in this process.

``` bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

You can now continue here: [Download Files](/panel/1.0/getting_started.md#download-files)
