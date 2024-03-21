# Legacy Upgrades
This upgrade guide is for **upgrading from 0.7.X to 1.3.x**. If you are trying to do an upgrade on a 1.X Panel
please [use this guide instead](/panel/1.0/updating.md). During this upgrade process you will have some periods
of Panel unavailability, however none of the underlying game server instances will be stopped.

## Enter Maintenance Mode
You'll want to put your Panel into maintenance mode by running the `down` command below before starting. This
will prevent users from accessing the Panel during a period where things will be broken or not working correctly. Make sure that you're in the `/var/www/pterodactyl` directory when executing the command.

``` bash
# Put the Panel into maintenance mode and deny user access
php artisan down
```

## Update Dependencies
You'll need to make sure your system dependencies are up to date before performing this upgrade. Please
reference the list below to ensure you have all of the required versions.

* PHP `8.1` with the following extensions: `cli`, `openssl`, `gd`, `mysql`, `PDO`, `mbstring`,
  `tokenizer`, `bcmath`, `xml` or `dom`, `curl`, `zip`, and `fpm` if you are planning to use nginx. See our guide
  for [Upgrading PHP](/guides/php_upgrade.md) for details.
* Composer v2 (`composer self-update --2`)

::: warning Nginx
If you upgrade your PHP version and are using nginx as your webserver, you will have to update the
`fastcgi_pass` value in your nginx's `pterodactyl.conf` configuration to use the correct `php-fpm` socket.
:::

* MySQL `5.7.22` or higher (MySQL `8` recommended) **or** MariaDB `10.2` or higher.

::: warning Seriously, Double Check your Database Version
Please make sure you are running the correct version of MariaDB or MySQL listed above! Failure to do so _will_
result in an error when you attempt to run the migrations.

Previous documentation (and just the age of this software) likely had you installing MariaDB 10.1 which _will not
work_ with this version of Pterodactyl.
:::

## Fetch Updated Files
The first step in the update process is to download the new panel files from GitHub. The command below will download
the release archive for the most recent version of Pterodactyl and save it in the current directory. Now is a good time
to ensure that you're in the `/var/www/pterodactyl` directory as the command below will automatically unpack the archive
into your current folder.

We will also be deleting the `app/` directory. Because of the way we handle installations and upgrades deleted files
are not always detected properly, so simply uppacking over this location will result in some confusing behavior.

``` bash
# Delete the app directory to ensure we start with a clean slate here. This will not affect any
# of your settings or servers.
curl -L -o panel.tar.gz https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz
rm -rf $(find app public resources -depth | head -n -1 | grep -Fv "$(tar -tf panel.tar.gz)")

# Download the updated files and delete the archive file.
tar -xzvf panel.tar.gz && rm -f panel.tar.gz
```

Once all of the files are downloaded we need to set the correct permissions on the cache and storage directories to avoid
any webserver related errors.

``` bash
chmod -R 755 storage/* bootstrap/cache
```

## Update Dependencies
After you've downloaded all of the new files you will need to upgrade the core components of the panel. To do this,
simply run the commands below and follow any prompts.

``` bash
composer install --no-dev --optimize-autoloader
```

## Clear Compiled Template Cache
You'll also want to clear the compiled template cache to ensure that new and modified templates show up correctly for
users.

``` bash
php artisan view:clear
php artisan config:clear
```

## Database Updates
You'll also need to update your database schema for the newest version of Pterodactyl. Running the two commands below
will update the schema and ensure the default eggs we ship are up to date (and add any new ones we might have). Just
remember, _never edit core eggs we ship_! They will be overwritten by this update process.

::: warning
If you used a custom plugin that allowed for server transfers on `0.7` you **MUST** delete or rename the `server_transfers` table
before continuing.
:::

``` bash
php artisan migrate --force
php artisan db:seed --force
```

## Set Permissions
The last step is to set the proper owner of the files to be the user that runs your webserver. In most cases this
is `www-data` but can vary from system to system &mdash; sometimes being `nginx`, `apache`, or even `nobody`.

``` bash
# If using NGINX or Apache (not on CentOS):
chown -R www-data:www-data *

# If using NGINX on CentOS:
chown -R nginx:nginx *

# If using Apache on CentOS
chown -R apache:apache *
```

## Restarting Queue Workers
After _every_ update you should restart the queue worker to ensure that the new code is loaded in and used.

``` bash
php artisan queue:restart
```

## Exit Maintenance Mode
Now that the upgrade is complete, exit maintenance mode and your Panel will now be available.

```bash
# Bring the Panel back up to receive connections.
php artisan up
```

## Switch to Wings
We've deprecated the old Node.js daemon in favor of [Wings](https://github.com/pterodactyl/wings), our new server
control plane written in Go. This new system is significantly faster, easier to install, and much smaller. All you
need to do is install a single binary on your system and configure it to run on boot. **You cannot use the old Node.js
Daemon to run servers with Pterodactyl Panel 1.0.**

Please see [Migrating to Wings](/wings/1.0/migrating.md) for instructions.
