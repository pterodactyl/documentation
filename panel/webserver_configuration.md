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

```
# If using Ubuntu this file should be placed in:
# 			/etc/nginx/sites-available/
#
# If using CentOS this file should be placed in:
#				 /etc/nginx/conf.d/
#
server {
    listen 80;
    server_name <domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <domain>;

    root /var/www/pterodactyl/public;
    index index.php;

    access_log /var/log/nginx/pterodactyl.app-access.log;
    error_log  /var/log/nginx/pterodactyl.app-error.log error;

    # allow larger file uploads and longer script runtimes
    client_max_body_size 100m;
    client_body_timeout 120s;
    
    sendfile off;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256';
    ssl_prefer_server_ciphers on;
    
    # See https://hstspreload.org/ before uncommenting the line below.
    # add_header Strict-Transport-Security "max-age=15768000; preload;";
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Robots-Tag none;
    add_header Content-Security-Policy "frame-ancestors 'self'";
    add_header X-Frame-Options DENY;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        # the fastcgi_pass path needs to be changed accordingly when using CentOS
        fastcgi_pass unix:/var/run/php/php7.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param PHP_VALUE "upload_max_filesize = 100M \n post_max_size=100M";
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param HTTP_PROXY "";
        fastcgi_intercept_errors off;
        fastcgi_buffer_size 16k;
        fastcgi_buffers 4 16k;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
        include /etc/nginx/fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

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
