# Enterprise Linux 8 and Fedora Server 40

This guide provides comprehensive instructions for installing Pterodactyl v1.X on CentOS 8, Rocky Linux 8, AlmaLinux 8, and Fedora Server 40, including all dependencies.

[[toc]]

## Install Dependencies

### SELinux Configuration

If SELinux is enabled (check with `sestatus`), install the following packages:

```bash
sudo dnf install -y policycoreutils selinux-policy selinux-policy-targeted setroubleshoot-server setools setools-console mcstrans
```

### Installing Dependencies

Run the following commands to install all necessary dependencies:

```bash
# Update system
sudo dnf update -y

# Install EPEL and Remi repository
sudo dnf install -y epel-release
# Add additional repositories for PHP (Enterprise Linux 8)
sudo dnf install -y https://rpms.remirepo.net/enterprise/remi-release-8.rpm
# Add additional repositories for PHP (Fedora Server 40)
sudo dnf install -y https://rpms.remirepo.net/fedora/remi-release-40.rpm

# Enable PHP 8.3 from Remi
sudo dnf module reset php
sudo dnf module enable php:remi-8.3 -y

# Install dependencies
sudo dnf install -y php php-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip} mariadb mariadb-server nginx redis zip unzip tar

# Start and enable services
sudo systemctl enable --now mariadb nginx redis

# Configure firewall
sudo firewall-cmd --add-service=http --permanent
sudo firewall-cmd --add-service=https --permanent 
sudo firewall-cmd --reload

# Install Composer
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

## PHP Configuration

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

## Installing the Panel
Excellent, we now have all of the required dependencies installed and configured. From here, follow the [official Panel installation documentation](/panel/1.0/getting_started.md#download-files).


::: tip
You will need to change the fastcgi_pass path in the Nginx configuration to `/var/run/php-fpm/pterodactyl.sock`
:::