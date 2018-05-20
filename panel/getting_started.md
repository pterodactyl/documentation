# Getting Started
Pterodactyl Panel is designed to run on your own web server. You will need to have root access to your server in order to run and use this panel.

You are expected to understand how to read documentation to use this Panel. We have spent many hours detailing how to install or upgrade our
software; take some time and read rather than copy and pasting and then complaining when things do not work. This panel does
not exist as a drag-and-drop service to run your servers. It is a highly complex system requiring multiple dependencies and
administrators willing to spend some time learning how to use it. **If you expect to be able to install this with no understanding
of basic linux system administration you should stop and turn around now.**

## Picking a Server OS
Pterodactyl runs on a wide range of operating systems, so pick whichever you are most comfortable using.

::: warning
Pterodactyl does not support most OpenVZ systems due to incompatabilities with Docker. If you are planning on running
this software on an OpenVZ based system you will not be successful.
:::

| Operating System | Version | Supported | Notes |
| ---------------- | ------- | :-------: | ----- |
| **Ubuntu** | 14.04 | :warning: | Documentation assumes changes to `systemd` introduced in `16.04` |
| | 16.04 | :white_check_mark: | Recommended. |
| | 18.04 | :white_check_mark: | |
| **CentOS** | 6 | :no_entry_sign: | Does not support all of the required packages. |
| | 7 | :white_check_mark: | |
| **Debian** | 8 | :white_check_mark: | |
| | 9 | :white_check_mark: | |

## Dependencies
* PHP `7.2` with the following extensions: 
    * CLI `php7.2-cli`
    * `openssl` (included with packaged versions)) 
    * GD `php7.2-gd`
    * MySQL `php7.2-mysql`
    * PDO `php7.2-pdo`
    * MBString `php7.2-mbstring`
    * Tokenizer `php7.2-tokenizer` 
    * BCMath `php7.2-bcmath` 
    * DOM `php7.2-xml` or `php7.2-dom`
    * cURL `php7.2-curl`
    * Zip `php7.2-zip`
* MySQL `>= 5.7` **or** MariaDB `>= 10.1.3`
* Redis (`redis-server`)
* A web server (e.g Apache, NGINX, Caddy, etc.) 
* cURL `curl`
* Tar `tar`
* Unzip `unzip`
* Git `git`

### Example Dependency Installation
The commands below are simply an example of how you might install these dependencies. Please consult with your
operating system's package manager to determine the correct packages to install.

```sh
# Add "add-apt-repository" command
apt -y install software-properties-common

# Add additional repositories for PHP, Redis, and MariaDB
add-apt-repository -y ppa:ondrej/php
add-apt-repository -y ppa:chris-lea/redis-server
curl -sS https://downloads.mariadb.com/MariaDB/mariadb_repo_setup | sudo bash

# Update repositories list
apt update

# Install Dependencies
apt -y install php7.2 php7.2-cli php7.2-gd php7.2-mysql php7.2-pdo php7.2-mbstring php7.2-tokenizer php7.2-bcmath php7.2-xml php7.2-fpm php7.2-curl php7.2-zip mariadb-server nginx curl tar unzip git redis-server
```

## Download Files
The first step in this process is to create the folder where the panel will live and then move ourselves into that
newly created folder. Below is an example of how to perform this operation.

``` sh
mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl
```

Once you have created a new directory for the Panel and moved into it you'll need to download the Panel files. This
is as simple as using `curl` to download our pre-packaged content. Once it is downloaded you'll need to unpack the archive
and then set the correct permissions on the `storage/` and `bootstrap/cache/` directories. These directories
allow us to store files as well as keep a speedy cache available to reduce load times.

```
curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/download/v0.7.6/panel.tar.gz
tar --strip-components=1 -xzvf panel.tar.gz
chmod -R 755 storage/* bootstrap/cache/
```
