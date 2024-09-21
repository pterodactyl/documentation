# CentOS 7

This guide provides comprehensive instructions for installing Pterodactyl v1.X on CentOS 7, including all dependencies and SSL configuration.

[[toc]]

## Install Dependencies

### SELinux Configuration

If SELinux is enabled (check with `sestatus`), install the following packages:

```bash
yum install -y policycoreutils policycoreutils-python selinux-policy selinux-policy-targeted libselinux-utils setroubleshoot-server setools setools-console mcstrans
```

### Installing Dependencies

Run the following commands to install all necessary dependencies:

```bash
# Add MariaDB repository
sudo tee /etc/yum.repos.d/mariadb.repo <<EOF
[mariadb]
name = MariaDB
baseurl = http://yum.mariadb.org/10.5/centos7-amd64
gpgkey = https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
gpgcheck = 1
EOF

# Install EPEL and Remi repositories
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
sudo yum install -y https://rpms.remirepo.net/enterprise/remi-release-7.rpm

# Enable PHP 8.3 from Remi
sudo yum install -y yum-utils
sudo yum-config-manager --disable 'remi-php*'
sudo yum-config-manager --enable remi-php83

sudo yum update -y

# Install dependencies
sudo yum install -y MariaDB-common MariaDB-server php php-{common,fpm,cli,json,mysqlnd,mcrypt,gd,mbstring,pdo,zip,bcmath,dom,opcache} nginx zip unzip

# Install Redis
sudo yum install -y --enablerepo=remi redis

# Start and enable services
sudo systemctl enable --now mariadb nginx redis

# Configure firewall
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-service=https --permanent 
sudo firewall-cmd --reload

# Install Composer
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

## Server Configuration

### PHP Configuration

Create a new PHP-FPM configuration file in /etc/php-fpm.d/www-pterodactyl.conf:

```conf
[pterodactyl]

user = nginx
group = nginx

listen = /var/run/php-fpm/pterodactyl.sock
listen.owner = nginx
listen.group = nginx
listen.mode = 0750

pm = ondemand
pm.max_children = 9
pm.process_idle_timeout = 10s
pm.max_requests = 200
```

Start and enable PHP-FPM:

```bash
sudo systemctl enable --now php-fpm
```

### SELinux configuration

The following command will allow nginx to work with redis.

```bash
setsebool -P httpd_can_network_connect 1
setsebool -P httpd_execmem 1
setsebool -P httpd_unified 1
```

## Installing the Panel
Excellent, we now have all of the required dependencies installed and configured. From here, follow the [official Panel installation documentation](/panel/1.0/getting_started.md#download-files).

::: tip
You will need to change the fastcgi_pass path in the Nginx configuration to `/var/run/php-fpm/pterodactyl.sock`
:::