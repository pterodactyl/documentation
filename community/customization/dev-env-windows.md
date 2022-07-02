# Making a dev enviroment in windows 10/11

### Make sure to:
- have wsl2 set up with ubuntu 20.04
- [have a mysql server on windows](https://dev.mysql.com/downloads/installer/)
- have nodejs and yarn installed
- have php7.4 or higher installed

### Steps:
1.  download the project from github (i forked it and cloned it with git)
2.  ONLY run: `yarn install`
3.  [setup mysql](https://pterodactyl.io/tutorials/mysql_setup.html) using the mysql command line client
4.  run: cp .env.example .env
5.  run: `composer install --no-dev --optimize-autoloader`
6.  run: `php artisan key:generate --force`
7.  run: `php artisan p:environment:setup`
8.  run: `php artisan p:environment:database`
9. run: `php artisan p:environment:mail`
10. run: `php artisan migrate --seed --force`
11. run: `php artisan p:user:make`
12. run: `yarn build:production` (do this every time you changed something)' for more info: [link](https://pterodactyl.io/community/customization/panel.html)
13. run: `php artisan serve` to start the webserver
