# Webserver Configuration

::: danger
You should remove the default Apache or NGINX configuration as it will expose application secrets to malicious users by default.
:::
::: warning
When using the SSL configuration you MUST create SSL certificates, otherwise your webserver will fail to start. See [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page for how to create these certificates before continuing.
:::

:::: tabs

## NGINX
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

::: tab "Nginx With SSL" id="first-tab"

<<< @/.snippets/webservers/nginx-php7.4.conf{5,11,26-27}
:::

::: tab "Nginx With-out SSL" id="second-tab"
<<< @/.snippets/webservers/nginx-php7.4-nossl.conf{3}
:::

### Enabling Configuration
The final step is to enable your NGINX configuration and restart it.
```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
systemctl restart nginx
```
::::

:::: tabs

## Apache
You should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place it in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` package installed or else PHP will not display on your webserver.

::: tab "Apache With SSL" id="first-tab"
Like the nginx configuration, this assumes you will be using SSL on both the Panel and Daemons for improved security.

<<< @/.snippets/webservers/apache.conf{2,8,17-18}
:::

::: tab "Apache With-out SSL" id="second-tab"
<<< @/.snippets/webservers/apache-nossl.conf{2}
:::

### Enabling Configuration
Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl restart httpd`.
```bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```
::::
