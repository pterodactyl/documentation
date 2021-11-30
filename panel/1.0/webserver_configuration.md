# Webserver Configuration

## Removing the default configuration
First of all you should remove the default Apache or NGINX configuration as it will expose application secrets to malicious users by default.
``` bash
# If using NGINX:
rm /etc/nginx/sites-available/default && rm /etc/nginx/sites-enabled/default

# If using Apache:
rm /etc/apache2/sites-enabled 000-default.conf 
```

## Creating Pterodactyl configuration
::: warning
When using the SSL configuration you MUST create SSL certificates, otherwise your webserver will fail to start. See the [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page to learn how to create these certificates before continuing.
:::

:::: tabs
::: tab "Nginx With SSL"
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

<<< @/.snippets/webservers/nginx-php8.0.conf{5,11,26-27}
### Enabling Configuration

The final step is to enable your NGINX configuration and restart it.

```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
systemctl restart nginx
```

:::
::: tab "Nginx Without SSL"
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

<<< @/.snippets/webservers/nginx-php8.0-nossl.conf{3}
### Enabling Configuration

The final step is to enable your NGINX configuration and restart it.

```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
systemctl restart nginx
```

:::
::: tab "Apache With SSL"
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` package installed or else PHP will not display on your webserver.

<<< @/.snippets/webservers/apache.conf{2,8,17-18}
### Enabling Configuration

Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl restart httpd`.

```bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```

:::
::: tab "Apache Without SSL"
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` package installed or else PHP will not display on your webserver.

<<< @/.snippets/webservers/apache-nossl.conf{2}
### Enabling Configuration
Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl restart httpd`.

```bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```

:::
::::

#### Next Step: [Wings Installation](../../wings/installing.md)
