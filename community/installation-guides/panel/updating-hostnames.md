cd /var/www/pterodactyl
sudo su
php artisan p:environment:setup
- Update the application URL

then run the following commands, this will allow pterodcatyl to refresh with the new hostname
php artisan view:clear
php artisan config:clear
php artisan migrate --force
php artisan db:seed --force
php artisan queue:restart

Update your doamin within your Nginx config file
pterodactyl.conf
