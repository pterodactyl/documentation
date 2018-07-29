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
Let's Encrypt. Please see our Creating SSL Certificates documentation for how to create these certificates before continuing.

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

<<< @/.snippets/webservers/apache.conf{2}

### Enabling Configuration
Once you've created the file above, simply run the commands below. If you are on CentOS _you do not need to run the commands
below!_ You only need to run `systemctl httpd restart`.

``` bash
# You do not need to run any of these commands on CentOS
sudo ln -s /etc/apache2/sites-available/pterodactyl.conf /etc/apache2/sites-enabled/pterodactyl.conf
sudo a2enmod rewrite
systemctl restart apache2
```

## Caddy
Caddy is a webserver with automatic https, this may come handy when you don't want to remake your ssl certificates every 90 days.
::: danger
Caddy is incompatible with other webservers, if you plan on running other websites on your panel you will have to add them to caddy too.
:::
/etc/caddy/Caddyfile:
``` json
panel.yourdomain.com {
    # Set the directory root
    root /var/www/pterodactyl/public
    # Let caddy know where fastcgi is for php, edit "7.2" to your php-fpm version
    fastcgi / /run/php/php7.2-fpm.sock php
    # rewrite all requests to index.php, this is required for how pterodactyl works
    rewrite {
        to {path} {path}/ /index.php
}
```
to turn it on:
``` bash
caddy -conf /etc/caddy/Caddyfile
```
To run caddy in the background use SystemD
``` bash
cat <<EOF > /etc/systemd/system/caddy@.service
[Unit]
Description=Caddy HTTP/2 web server %I
Documentation=https://caddyserver.com/docs
After=network.target

[Service]
User=%i
Environment=STNORESTART=yes
ExecStart=/usr/sbin/caddy -agree=true -conf=/etc/caddy/Caddyfile
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF
```
reload the systemd daemon: `systemctl daemon-reload`
start the service: `systemctl start caddy@root`
enable it (to start it automatically on boot): `systemctl enable caddy@root`
to restart it: `systemctl restart caddy@root`
For more documentation on how to use the caddy webserver, go here https://caddyserver.com/docs.
