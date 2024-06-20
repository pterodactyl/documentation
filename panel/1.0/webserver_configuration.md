# Webserver Configuration

::: warning
When using the SSL configuration you MUST create SSL certificates, otherwise your webserver will fail to start. See the [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page to learn how to create these certificates before continuing.
:::

::: tip
If you are using [Caddy With Automatic SSL](#caddy-with-automatic-ssl), you do not have to create SSL certificates manually, Caddy will take care of it automatically.
:::

::::: tabs
:::: tab "Nginx With SSL"
First, remove the default NGINX configuration.

``` bash
rm /etc/nginx/sites-enabled/default
```

Now, you should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place the file in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

<<< @/.snippets/webservers/nginx-php8.1.conf{5,11,26-27}

### Enabling Configuration

The final step is to enable your NGINX configuration and restart it.

```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
sudo systemctl restart nginx
```

::::
:::: tab "Nginx Without SSL"
First, remove the default NGINX configuration.

``` bash
rm /etc/nginx/sites-enabled/default
```

Now, you should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place the file in `/etc/nginx/sites-available/`, or &mdash; if on CentOS, `/etc/nginx/conf.d/`.

<<< @/.snippets/webservers/nginx-php8.1-nossl.conf{4}

### Enabling Configuration

The final step is to enable your NGINX configuration and restart it.

```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/pterodactyl.conf

# You need to restart nginx regardless of OS.
sudo systemctl restart nginx
```

::::
:::: tab "Apache With SSL"
First, remove the default Apache configuration.

``` bash
a2dissite 000-default.conf
```

Now, you should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place the file in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` package installed or else PHP will not display on your webserver.

<<< @/.snippets/webservers/apache.conf{2,10,24-25}

### Enabling Configuration

Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl restart httpd`.

```bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
sudo a2enmod ssl
sudo systemctl restart apache2
```

::::
:::: tab "Apache Without SSL"
First, remove the default Apache configuration.

``` bash
a2dissite 000-default.conf
```

Now, you should paste the contents of the file below, replacing `<domain>` with your domain name being used in a file called
`pterodactyl.conf` and place the file in `/etc/apache2/sites-available`, or &mdash; if on CentOS, `/etc/httpd/conf.d/`.

Note: When using Apache, make sure you have the `libapache2-mod-php` and `libapache2-mod-php8.1` package installed or else PHP will not display on your webserver.

<<< @/.snippets/webservers/apache-nossl.conf{2}

### Enabling Configuration

Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl restart httpd`.

```bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
sudo systemctl restart apache2
```

::::
:::: tab "Caddy With Automatic SSL"
Before adding our custom configuration, let's remove the default one. You can do it either by deleting the contents of config file or by deleting the config file completely and than creating a new one from scratch. The config file path is `/etc/caddy/Caddyfile`.

To delete the config file completely, run the following command:

```shell
rm /etc/caddy/Caddyfile
```

Then continue with an editor of your choice to write the config.

You should paste the contents of the file below, replacing `<domain>` with your domain name.

<<< @/.snippets/webservers/Caddyfile{9}

::: tip
If you are using Cloudflare DNS in proxy mode, refer to [this tutorial](/tutorials/creating_ssl_certificates.html#method-3:-caddy-(using-cloudflare-api)), to see how to configure Caddy to use DNS challenge for obtaining SSL certificates.
:::

### Enabling Configuration

The final step is to restart Caddy.

```bash
systemctl restart caddy
```

::::
:::: tab "Caddy Without SSL"
Before adding our custom configuration, let's remove the default one. You can do it either by deleting the contents of config file or by deleting the config file completely and than creating a new one from scratch. The config file path is `/etc/caddy/Caddyfile`.

To delete the config file completely, run the following command:

```shell
rm /etc/caddy/Caddyfile
```

Then continue with an editor of your choice to write the config.

You should paste the contents of the file below, replacing `<domain>` with your domain name.

The only two differences are that we have suffixed the `<domain>` with `:80` and in the global config at `servers` directive, we have changed the port from `:443` to `:80`.

<<< @/.snippets/webservers/Caddyfile-nossl{9}

### Enabling Configuration

The final step is to restart Caddy.

```bash
systemctl restart caddy
```

::::
:::::

#### Next Step: [Wings Installation](../../wings/installing.md)
