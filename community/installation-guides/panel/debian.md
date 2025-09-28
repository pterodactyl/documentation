# Debian 11, 12 & 13

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/1.0/getting_started.md) but is tailored specifically for Debian 11, 12 and 13.
:::

| Operating System                   | Version |     Supported      | Notes                                                       |
| ---------------------------------- | ------- | :----------------: | ----------------------------------------------------------- |
| **Debian**                         | 11      | :white_check_mark: |                                                             |
|                                    | 12      | :white_check_mark: |                                                             |
|                                    | 13      | :white_check_mark: | - MariaDB can be installed without the repo setup script<br> - Redis can be installed without the Redis APT repository |

## Dependency Installation

In this guide, we will install the required dependencies for the Pterodactyl panel. After that, you can follow the official installation documentation.

```bash
# Install necessary packages
apt install -y curl ca-certificates gnupg2 sudo lsb-release

# Add additional repositories for PHP
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/sury-php.list
curl -fsSL https://packages.sury.org/php/apt.gpg | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/sury-keyring.gpg

# Add Redis official APT repository (Debian 11 & 12)
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# MariaDB repo setup script (Debian 11 & 12)
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | sudo bash

# Update repositories list
apt update

# Install Dependencies
apt install -y php8.3 php8.3-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip} mariadb-server nginx tar unzip git redis-server
```

### Installing Composer

Composer is a dependency manager for PHP that allows us to ship everything you'll need code wise to operate the Panel. You'll need composer installed before continuing in this process.

``` bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

### Download Files

Great, now all of the dependencies have been dealt with. Continue the installation by following the [official documentation Download Files section](/panel/1.0/getting_started.md#download-files).

### Wings

There is no additional configuration required for Wings on Debian 11, 12 or 13. You can follow the [official Wings install documentation](/wings/1.0/installing.md), which covers Docker installation for Debian.
