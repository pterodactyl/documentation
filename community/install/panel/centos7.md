# Install pterodactyl on CentOS 7

This guide covers the installation of the requirements for a panel with SSL enabled.

[[toc]]

## Install Requirements

The panel requirements can be found [here](/panel/getting_started.md#dependencies)

### MariaDB

```bash
## Install Repos
cat <<EOF > /etc/yum.repos.d/mariadb.repo
# MariaDB 10.2 CentOS repository list - created 2017-07-14 12:40 UTC
# http://downloads.mariadb.org/mariadb/repositories/
[mariadb]
name = MariaDB
baseurl = http://yum.mariadb.org/10.2/centos7-amd64
gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
gpgcheck=1
EOF

## Get yum updates
yum update -y

## Install MariaDB 10.2
yum install -y MariaDB-common MariaDB-server

## Start maraidb
systemctl start mariadb
systemctl enable mariadb
```

### PHP 7.2
We recommend the ius repo to get the latest php packages.

```bash
## Install Repos
yum install -y epel-release https://centos7.iuscommunity.org/ius-release.rpm

## Get yum updates
yum update -y

## Install PHP 7.2
yum install -y php72u-php php72u-common php72u-fpm php72u-cli php72u-json php72u-mysqlnd php72u-mcrypt php72u-gd php72u-mbstring php72u-pdo php72u-zip php72u-bcmath php72u-dom php72u-opcache
```

### nginx

```bash
yum install -y nginx

firewall-cmd --add-service=http --permanent
firewall-cmd --add-service=https --permanent 
firewall-cmd --reload
```

### Redis

```bash
yum install -y redis40u

systemctl start redis
systemctl enable redis
```

### utilities

#### certbot
```bash
yum install -y certbot
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

Place the contents below in a file inside the `/etc/php-fpm.d` folder. The file can be named anything, but a good standard is `www-pterodactyl.conf`. This config will match the nginx config later in the guide.

<<< @/.snippets/php-fpm/pterodactyl-centos.conf

Start and enable php-fpm on the system.
```bash
systemctl enable php-fpm
systemctl start php-fpm
```

### nginx

follow the [tutorial](/tutorials/creating_ssl_certificates.md) on generating an SSL cert to use.

#### ssl config
<<< @/.snippets/webservers/nginx-centos.conf{5,11,26-27}

### Redis
The default Redis install is perfectly fine for the panel.

If you have Redis already in use you may want to look into running another Redis instance similar to [this guide](https://community.pivotal.io/s/article/How-to-setup-and-run-multiple-Redis-server-instances-on-a-Linux-host)

## Installing the panel
Follow the regular guide to install the [panel](/panel/getting_started.md#installation)
