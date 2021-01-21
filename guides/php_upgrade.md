# Upgrading PHP

| Panel Version | PHP Version  |
| ------------- | ------------ |
| 1.0.0 - 1.2.0 | ^7.3 \| ^7.4 |
| 1.3.0         | ^7.4 \| ^8.0 |

## Install PHP 7.4
In order to install PHP 7.4, you will need to run the following command.
```bash
apt -y install php7.4 php7.4-{cli,gd,mysql,pdo,mbstring,tokenizer,bcmath,xml,fpm,curl,zip}
```

Once you have installed PHP 7.4, you will need to update your webserver configuration.

## Update Composer
As of `Panel@1.3.0` we require `composer` v2.  To update composer you will need to run the following command.
```bash
composer self-update --2
```

## Webserver Configuration
### NGINX
After upgrading to PHP 7.4, you will most likely need to update your NGINX configuration.

By default, your webserver configuration should be located at `/etc/nginx/sites-available/nginx.conf`.

You can open the file by using `nano /etc/nginx/sites-available/nginx.conf`, once the file is open you will need to
replace `fastcgi_pass unix:/run/php/php7.3-fpm.sock;` with `fastcgi_pass unix:/run/php/php7.4-fpm.sock;`
(this line will be located towards the end of the file).

Once you have edited the file, you will need to reload nginx.  You can do this by running the following command
```bash
systemctl reload nginx
```

If you were upgrading your Panel you may now continue that process. [1.X.X Upgrade Guide](/panel/1.0/upgrade/1.0.md#fetch-updated-files)

### Apache
```bash
a2enmod php7.4
a2dismod php7.2
```

If you were upgrading your Panel you may now continue that process. [1.X.X Upgrade Guide](/panel/1.0/upgrade/1.0.md#fetch-updated-files)
