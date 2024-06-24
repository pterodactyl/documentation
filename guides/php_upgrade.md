# Upgrading PHP

This documentation includes instructions for upgrading your system to the latest version of PHP. Please reference the
table below to check what version you need for your version of Pterodactyl.

| Panel Version | PHP Version   |
|---------------|---------------|
| 1.0.0 - 1.2.0 | 7.3, 7.4      |
| 1.3.0+        | 7.4, 8.0      |
| 1.8.0+        | 7.4, 8.0, 8.1 |
| 1.11.0+       | 8.1           |

## Install PHP

In order to install PHP 8.1, you will need to run the following command. Please keep in mind different operating systems
may have slightly different requirements for how this command is formatted.

```bash
# Add additional repository for PHP
add-apt-repository -y ppa:ondrej/php
apt -y update
apt -y install php8.1 php8.1-{cli,gd,mysql,pdo,mbstring,tokenizer,bcmath,xml,fpm,curl,zip}
```

## Update Composer

As of `Panel@1.3.0` we require `composer` v2. To update composer you will need to run the following command which will
perform the composer self-update process and move you over to version 2.

```bash
composer self-update --2
```

## Webserver Configuration

:::: tabs
::: tab "NGINX"
After upgrading to PHP 8.1, you will most likely need to update your NGINX configuration. Your configuration file
is most likely called `pterodactyl.conf` and located in the `/etc/nginx/sites-available/` directory, or if on CentOS,
`/etc/nginx/conf.d/`.

Make sure to update the path in the command below to reflect the actual location of your configuration file.

``` bash
sed -i -e 's/php[7|8].[0-9]-fpm.sock/php8.1-fpm.sock/' /etc/nginx/sites-available/pterodactyl.conf
```

Once you have edited the file run the command below to reload nginx and apply your changes.

```bash
systemctl reload nginx
```

:::
::: tab "Apache"
Run the commands below to disable all previous PHP versions and enable PHP 8.1 when serving requests.

``` bash
# Hint: a2dismod = a2_disable_module 🤯
a2dismod php*

# Hint: a2enmod = a2_enable_module 🤯
a2enmod php8.1

```

:::
::::

### [Return to the 1.X.X Upgrade Guide](/panel/1.0/upgrade/1.0.md#fetch-updated-files)
