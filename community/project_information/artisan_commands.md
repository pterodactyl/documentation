# Pterodactyl Artisan Commands
::: danger
All the commands are run in your panel web root directory, most likely `/var/www/pterodactyl`
:::
:::tip
Some commands have been skipped
:::
## Database Setup
```bash
php artisan p:environment:database
```
This command will execute pterodactyls ENV database setup. Here you will be asked for the following
- Database Host : Server your database is hosted on `Most likely 127.0.0.1`
- Database Port : Port of your Database `Default 3306`
- Database Name : Schema name of your Database
- Database Username : Your database user `DO NOT USE ROOT`
- Database Password : Password for your Database `This will not show on screen`

## Mail Setup
```bash
php artisan p:environment:mail
```
:::tip
You will certainly not be asked to use all of the following
:::
This command will execute pterodactyls ENV mail setup. Here you will be asked for the following
- Which driver should be used for sending emails? : Here you need to chose your mail driver
  * SMTP : SMTP server, This is the most common way to setup email using an external mail server.
  * MAIL : Internal mail system. This option does not require a mail server.
  * MAILGUN : Mailgun Transactional Email
  * Mandrill Transactional Email
  * Postmarkapp Transactional Email
- SMTP Host : Server you are using to send your emails when using the `SMTP` driver.
- SMTP Port : Port used by your SMTP server.
- SMTP User : User for your pterodactyl mail.
- SMTP Password : Password used by your SMTP user.
- Email address emails should originate from
- Name that emails should appear from
- Encryption method to use
  * TLS
  * SSL
  * NONE
- Mailgun Domain : Domain you use for your mail-gun account
- Mailgun Secret : Auch used for your mail-gun account
- Mandrill Secret : Auch used for your Mandrill account
- Postmark API Key : API key used for your Postmark account
## Environment Setup
```bash
php artisan p:environment:setup
```
This is the basic ENV setup for pterodactyl.
- Egg Author Email : Here you will be asked to provide a valid email for the egg Author. If this email isn't valid the panel will not allow you to create new eggs and nests.
- Application URL : The panel url you want to use. If you have a domain make this something like `panel.domain.tld` otherwise you may use your IP. This needs to be reachable by all your daemon servers.
- Application Timezone : The timezone used by your panel and daemons. This will be the time shown in logs and used by all the docker containers. If you are looking for the whole list of the time-zones you will find it [Here](https://www.php.net/manual/en/timezones.php)
- Cache Driver : The Cache driver used by pterodactyl.
- Session Driver : The Session driver used by pterodactyl.
- Queue Driver : The Queue driver used by pterodactyl.
- Enable UI based settings editor? : This will disable some of the panel settings options.
## Info
```bash
php artisan p:info
```
This will show you all the application info for your panel installation.
## Delete Location
```bash
php artisan p:location:delete
```
This will delete a location from the panel
## Create Location
```bash
php artisan p:location:make
```
This will create a location in the panel
## Clean Service Backups
```bash
php artisan p:maintenance:clean-service-backups
```
This will clean `.bak` files that are no longer in use
## Clean Unused API keys
```bash
php artisan p:migration:clean-orphaned-keys
```
This will remove unused API keys from your database
## Force Schedule
```bash
php artisan p:schedule:process
```
This will force the schedules to be checked and ran if required
## Bulk Power
```bash
php artisan p:server:bulk-power <power action> {--arguments}
```
This will send a bulk power action to your servers
- Power actions:
  * stop : Stops all the servers
  * start : Starts all the servers
  * kill : Kills all the servers
  * restart : Restarts all the servers
- Arguments
  * servers[=SERVERS] : A comma separated list of server ids
  * nodes[=NODES] : A comma separated list of node ids
## Server Rebuild
```bash
php artisan p:server:rebuild <serverid>
```
Rebuilds the specified server
## Delete User
```bash
php artisan p:user:delete
```
Opens a user delete wizard asking for their username or email. After a DB query it'll present you with a list of user ids to pick and delete. `The ids are DB ids and NOT in order`
## Disable 2FA for a user
```bash
php artisan p:user:disable2fa
```
Disable 2FA for a single user. fter a DB query it'll present you with a list of user ids to pick and delete. `The ids are DB ids and NOT in order`
## Create a user
```bash
php artisan p:user:make
```
Opens a create user wizard<br>
## Common Errors
### ENV setup
```
SQLSTATE[HY000] [1698] Access denied for user 'user'@'localhost' (SQL: SELECT 1 FROM dual)
```
This error is mostly caused when the user you are trying to use has incorrect credentials for the database. Whoever it may be caused by many other options. To start troubleshooting do `systemctl status mysql` Here you will find details on the reason why the database is refusing connection. If you are using root it will always show this error. You need to have a separate user for security reasons
