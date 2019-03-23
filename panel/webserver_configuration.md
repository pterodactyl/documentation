# Webserver Configuration

[[toc]]

::: danger
You should remove the default Apache or NGINX configuration as it will expose application secrets to malicious
users by default.
:::

## NGINX
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

### NGINX With SSL
This configuration assumes that you will be using SSL on both the Panel and Daemons for significantly improved communication
security between users and the Panel. You will need to get a valid SSL certificate which can be done for free by using
Let's Encrypt. Please see our [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page for how to create these certificates before continuing.

<<< @/.snippets/webservers/nginx.conf{5,11,26-27}

Continue reading to the bottom of this section for the final steps with NGINX!

### NGINX Without SSL

<<< @/.snippets/webservers/nginx-nossl.conf{3}

### Enabling Configuration
The final step is to enable your NGINX configuration and restart it.
``` bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
systemctl restart nginx
```

## Apache
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` package installed or else PHP will not display on your webserver.

### Apache With SSL
Like the nginx configuration, this assumes you will be using SSL on both the Panel and Daemons for improved security. You will need to visit our [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page on how to create these certificates.

<<< @/.snippets/webservers/apache.conf{2,8,17-18}

### Apache Without SSL

<<< @/.snippets/webservers/apache-nossl.conf{2}

### Enabling Configuration
Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl httpd restart`.

``` bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```
