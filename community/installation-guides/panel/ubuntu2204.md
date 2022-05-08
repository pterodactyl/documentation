# Ubuntu 22.04
In this guide we will install Pterodactyl v1.X — including all of it's dependencies — and configure our webserver to serve it using SSL.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/1.0/getting_started.md) but is tailored specifically for Ubuntu 22.04.
:::

# Dependencies

### add-apt-repository
```bash
apt -y install software-properties-common curl apt-transport-https ca-certificates gnupg
```

### add php repo
```bash
LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
```

### MariaDB
```bash
## Get apt updates
apt update -y

## Install MariaDB
apt install -y sudo apt install mariadb-server
```

### add redis repo
```bash
add-apt-repository ppa:redislabs/redis
```
### add universe repository
```bash
add-apt-repository universe
```

### install php , mariadb , nginx , tar , unzip , git, redis-serevr
```bash
apt -y install php8.0 php8.0-{cli,gd,mysql,pdo,mbstring,tokenizer,bcmath,xml,fpm,curl,zip} mariadb-server nginx tar unzip git redis-server
```
### install composer
```bash
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

# Return to offical guide
Now you continue to the offical guide [here](/panel/1.0/getting_started.md#download-files)