# CentOS 8, Rocky Linux 8, AlmaLinux 8, Fedora Server 38
In this guide we will install Pterodactyl v1.X — including all of it's dependencies — and configure our webserver to serve it using SSL.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/panel/1.0/getting_started.md) but is tailored specifically for Enterprise Linux 8.
:::

## Install Requirements and Additional Utilities
We will install all of Pterodactyl's [required](/panel/1.0/getting_started.md#dependencies) dependencies and a few aditional utilities.

::: tip
If you run `sestatus` and it shows `SELinux status: enabled` you should install the following packages for later
:::

### SELinux tools
```bash
dnf install -y policycoreutils selinux-policy selinux-policy-targeted setroubleshoot-server setools setools-console mcstrans
```

### MariaDB
```bash
dnf install -y mariadb mariadb-server

## Start maraidb
systemctl start mariadb
systemctl enable mariadb
```

### PHP 8.0
We recommend the remi repo to get the latest php packages. (Skip to next section if on Fedora 38)

```bash
## Install Repos
dnf install epel-release
dnf install https://rpms.remirepo.net/enterprise/remi-release-8.rpm
dnf module enable php:remi-8.1

## Get dnf updates
dnf update -y

## Install PHP 8.1
dnf install -y php php-{common,fpm,cli,json,mysqlnd,gd,mbstring,pdo,zip,bcmath,dom,opcache}
```

### If using Fedora Server 38 install PHP 8.1 and Dependencies from this section. If not, skip this section.
```bash
dnf install https://rpms.remirepo.net/fedora/remi-release-38.rpm
dnf module enable php:remi-8.1
dnf install php php-{common,fpm,cli,json,mysqlnd,gd,mbstring,pdo,zip,bcmath,dom,opcache,process}
```

### Composer
```bash
dnf install -y zip unzip tar # Required for Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
```

## Install Utility Packages


### Nginx
```bash
dnf install -y nginx

firewall-cmd --add-service=http --permanent
firewall-cmd --add-service=https --permanent 
firewall-cmd --reload
```

### Redis
```bash
dnf install -y redis

systemctl start redis
systemctl enable redis
```

#### SELinux commands

The following command will allow nginx to work with redis and 
```bash
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_execmem 1
setsebool -P httpd_unified 1
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

All done! If you've completed all of the above steps, your MariaDB  
installation should now be secure.

#### Adding MariaDB user
To add your first user to the database, see our tutorial on [setting up MySQL](/tutorials/mysql_setup.md).

### Setup PHP
Place the contents below in a file inside the `/etc/php-fpm.d` folder. The file can be named anything, but a good standard is `www-pterodactyl.conf`. This config will match the nginx config later in the guide.

<<< @/.snippets/php-fpm/pterodactyl-centos.conf

Start and enable php-fpm on the system.
```bash
systemctl enable php-fpm
systemctl start php-fpm
```

### Nginx
Please check our [tutorial](/tutorials/creating_ssl_certificates.md) on generating SSL certificates for more information.

#### SSL Configuration
<<< @/.snippets/webservers/nginx-centos.conf{5,11,26-27}

### Redis Setup
The default Redis install is perfectly fine for the panel. If you have Redis already in use you may want to look into
[running another Redis instance](https://community.pivotal.io/s/article/How-to-setup-and-run-multiple-Redis-server-instances-on-a-Linux-host).

## Installing the Panel
Excellent, we now have all of the required dependencies installed and configured. From here, follow the [official Panel installation documentation](/panel/1.0/getting_started.md#download-files).
