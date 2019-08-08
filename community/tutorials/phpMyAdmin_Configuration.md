# Setting up phpMyAdmin with Pterodactyl

phpMyAdmin is a web based solution for accesing/editing your databases. We will add a subdomain for it and change php code of the panel to add a hyperlink to it.

## Installing phpMyAdmin
Assuming you have installed pterodactyl properly on the machine this will be really simple since you should have most of your dependencies pre installed.

### Update Repository and Install phpMyAdmin
This guide follows thesame practices as the main panel guide. Setting up a subdomain using a none default  web root folder assuming you are running on Ubuntu 16.04+
To get started we need to create a directory for phpMyadmin to sit in, and enter it
```bash
mkdir /var/www/phpmyadmin && cd /var/www/phpmyadmin
```
Following this visit the [phpMyAdmin download site](https://www.phpmyadmin.net/downloads/) and coppy the lastest download link by rightclicking it, the link should look as follows `https://files.phpmyadmin.net/phpMyAdmin/<version>/phpMyAdmin-<version>-all-languages.zip` We need to download this onto our server and unpack it.
```bash
wget <downloadlink>
tar xvzf phpMyAdmin-<version>-english.tar.gz
```
After you extract it you'll find a new folder called phpMyAdmin-<version>-english we need to move the contencs of this file to the webroot of our subdomain
```bash
mv /var/www/phpmyadmin/phpMyAdmin-<version>-english/* /var/www/phpmyadmin
```

Next up we need to add the phpMyAdmin user and set the ritgt premissions
```bash
sudo adduser phpmyadmin
#Follow the steps prompted to add a user
sudo chown -R phpmyadmin.phpmyadmin /var/www/phpmyadmin
```
After this we setup phpMyAdmin to be ready for our setup
```bash
cd /var/www/phpmyadmin
mkdir config
chmod o+rw config
cp config.sample.inc.php config/config.inc.php
chmod o+w config/config.inc.php
```

## WebServer Configuration
At this stage we will configure the vhost for phpMyAdmin to create it's subdomain, this setup will be ssl only! If you are using cloudflare ssl you can follow a guide in this section to use the aproperiate key.
### Getting the ssl certificate.
In this guide I will assume you followed [these steps](https://pterodactyl.io/tutorials/creating_ssl_certificates.html) to ssl your panel, therefor I will skip the install of certbot
You will need to setup a new cert for the database subdomain as follows
```bash
#Stop your webserver
#NGINX
systemctl stop nginx
#Apache
systemctl stop apache2
#Create certifcate, Replace <domain> with the subdomain you like to use for phpMyAdmin
certbot certonly -d <domain>
#You may start your webservers again whoever we will be editing thier config files therefore it can stay turned off
```
### Nginx Configuration
Create a file `phpmyadmin.conf` in `/etc/nginx/sites-available/`
Replace `<domain>` with your FQDN `subdomain.example.com` There are 4 instances of `<domain>`
```conf
server {
    listen 80;
    server_name <domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <domain>;

    root /var/www/phpmyadmin;
    index index.php;

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
    add_header Referrer-Policy same-origin;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass unix:/run/php/php7.2-fpm.sock;
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
To apply the configuration do
```bash
# You do not need to symlink this file if you are using CentOS.
sudo ln -s /etc/nginx/sites-available/phpmyadmin.conf /etc/nginx/sites-enabled/phpmyadmin.conf

# You need to restart nginx regardless of OS.
systemctl restart nginx
```
### Apache Configuration
Like NGINX this configuration does assume you have ssl setup and ready to go.
Create a file `phpmyadmin.conf` in `/etc/apache2/sites-available` you will need to replace the `<domain>` with your FQDN here there are 3 instances of `<domain>`
```conf
<VirtualHost *:80>
  ServerName <domain>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^/?(.*) https://%{SERVER_NAME}/$1 [R,L]
</VirtualHost>
<VirtualHost *:443>
  ServerName <domain>
  DocumentRoot "/var/www/phpmyadmin"
  AllowEncodedSlashes On
  php_value upload_max_filesize 100M
  php_value post_max_size 100M
  <Directory "/var/www/phpmyadmin">
    AllowOverride all
  </Directory>
  SSLEngine on
  SSLCertificateFile /etc/letsencrypt/live/<domain>/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/<domain>/privkey.pem
</VirtualHost>
```
To enable this configuration run the following commands
```bash
sudo ln -s /etc/apache2/sites-available/phpmyadmin.conf /etc/apache2/sites-enabled/phpmyadmin.conf
sudo a2enmod rewrite
systemctl restart apache2
```
## phpMyAdmin configuration
Now we need to configure phpMyAdmin to acces your database
### Accessing Setup Wizard
To access the setup wizard go to `exampledomain.com/setup/index.php`
Remember you should have set this up as a subdomain in the above web-server configuration. Here you will also see if there are any errors in your install. Make sure to fix them as they may lead to you having an insecure/not fully functional phpMyAdmin.
After reviewing the errors click "New server" button and fill out the required details.
### Finishing Setup
To finish the setup make sure to remove the config folder of phpMyAdmin as otherwise anyone can change your settings
```bash
rm -rf /var/www/phpmyadmin/config
```
## Now after reading just under 200 lines you are DONE! Congratulations!
