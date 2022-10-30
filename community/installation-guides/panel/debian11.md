# Debian 11

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/1.0/getting_started.md) but is tailored specifically for Debian 11.
:::

## Dependency Installation

In this guide, we will install the required dependencies for the Pterodactyl panel. After that, you can follow the official installation documentation.

```bash
# Update  package lists
apt update -y

# Install necessary packages
apt -y install software-properties-common curl ca-certificates gnupg2 sudo lsb-release

# Add repository for PHP
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list

curl -fsSL  https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg

# Add repository for Redis
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# Update  package lists
apt update -y

# Install PHP and required extensions
apt install -y php8.1 php8.1-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip}

# MariaDB repo setup script
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash

# Install the rest of dependencies
apt install -y mariadb-server nginx tar unzip git redis-server

```

### Installing Composer

Composer is a dependency manager for PHP that allows us to ship everything you'll need code wise to operate the Panel. You'll
need composer installed before continuing in this process.

``` bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

### Download Files

Great, now all of the dependencies have been dealt with. Continue the installation by following the [official documentation Download Files section](/panel/1.0/getting_started.md#download-files).
