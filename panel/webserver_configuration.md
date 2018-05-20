# Webserver Configuration
The final step in the install process is to setup your webserver to make your panel publicly accessible.

::: danger Remove the Default Configuration
We highly recommend you remove the default Apache or Nginx configuration as it might expose non-public directories in some instances. Make sure to restart the web-server after doing so.
:::

## NGINX
If you are using NGINX, simply create a new file called `pterodactyl.conf` in the `/etc/nginx/sites-available` directory and then replace `<domain>` with the IP or Fully Qualified Domain Name (e.x. `panel.example.com`) in the configuration file below.

::: warning NGINX Tutorial Assumes SSL Setup
This tutorial assumes that you will be using SSL on both the panel and daemons for significantly improved communication security between users and the panel. You will need to get a valid SSL certificate which can be done for free by using Let's Encrypt. Please see our [Creating SSL Certificates](#) tutorial for how to create these certificates before continuing.
:::

[SSL Configuration](/config/nginx_ssl.md)

[No SSL/IP Address Configuration](/config/nginx_nossl.md)

Depending on your PHP configuration you may need to change the fastcgi_pass variable to point to a TCP port or a different Unix socket. This is especially the case for CentOS.

The final step is to restart NGINX with the command below.

Ubuntu:
```
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf
service nginx restart
```

CentOS:
```
systemctl restart php-fpm
systemctl restart nginx
```

## Apache
If you are using apache create a new file called `pterodactyl.conf` in the directory `/etc/apache2/sites-available` with the contents below. You should replace `<domain>` with the IP or Fully Qualified Domain Name (e.x. `panel.myserver.com`) in the configuration below.

[SSL Configuration](/config/apace_ssl.md)

[No SSL/IP Address Configuration](/config/apache_nossl.md)

Run the commands below to finish setting up Apache and start the webserver.

Ubuntu:
```
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```

CentOS:
```
systemctl restart httpd
```

::: tip Yay, Panel Installed!
Congratulations, your panel is now fully installed and you can begin using it!

Now we need to add a new daemon, documentation for doing this can be found on [Our Daemon Documentation](#).
:::
