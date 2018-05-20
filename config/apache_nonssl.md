# Apache w/o SSL

[Back to Webserver Configuration](/panel/webserver_configuration.md)

```
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

[Back to Webserver Configuration](/panel/webserver_configuration.md)
