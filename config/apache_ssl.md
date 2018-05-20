# Apache w/ SSL

[Back to Webserver Configuration](/panel/webserver_configuration.md)

```
<VirtualHost *:80>
  ServerName <domain>
  RewriteEngine On
  RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

<VirtualHost *:443>
  ServerName <domain>
  DocumentRoot "/var/www/pterodactyl/public"
  AllowEncodedSlashes On
  php_value upload_max_filesize 100M
  php_value post_max_size 100M

  SSLEngine on
  SSLCertificateFile /etc/letsencrypt/live/<domain>/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/<domain>/privkey.pem
  SSLCertificateChainFile /etc/letsencrypt/live/<domain>/chain.pem

  <Directory "/var/www/pterodactyl/public">
    AllowOverride all
  </Directory>
</VirtualHost>
```

[Back to Webserver Configuration](/panel/webserver_configuration.md)
