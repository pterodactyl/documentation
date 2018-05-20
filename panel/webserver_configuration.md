# Webserver Configuration
The final step in the install process is to setup your webserver to make your panel publicly accessible.

::: danger Remove the Default Configuration
We highly recommend you remove the default Apache or Nginx configuration as it might expose non-public directories in some instances. Make sure to restart the web-server after doing so.
:::

## NGINX
If you are using NGINX, simply create a new file called `pterodactyl.conf` and then replace `<domain>` with the IP or Fully Qualified Domain Name (e.x. `panel.example.com`) in the configuration file below.

::: warning NGINX Tutorial Assumes SSL Setup
This tutorial assumes that you will be using SSL on both the panel and daemons for significantly improved communication security between users and the panel. You will need to get a valid SSL certificate which can be done for free by using Let's Encrypt. Please see our [Creating SSL Certificates](#) tutorial for how to create these certificates before continuing.
:::

## Apache
If you are using apache create a new file called `pterodactyl.conf` with the contents below. You should replace `<domain>` with the IP or Fully Qualified Domain Name (e.x. `panel.myserver.com`) in the configuration below.

```
# If using Ubuntu, this file should be placed in:
#	     /etc/apache2/sites-available
#
# If using CentOS this file should be placed in:
#  	   /etc/httpd/conf.d/
#
<VirtualHost *:80>
  ServerName <domain>
  DocumentRoot "/var/www/pterodactyl/public"
  AllowEncodedSlashes On
  php_value upload_max_filesize 100M
  php_value post_max_size 100M
  <Directory "/var/www/pterodactyl/public">
    AllowOverride all
  </Directory>
</VirtualHost>
```

Run the commands below to finish setting up Apache and start the webserver.

```
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```
