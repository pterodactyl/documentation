# Updating the Panel

This documentation covers the process for updating within the `1.x` series of releases. This means updating from
&mdash; for example &mdash; `1.5.0` to `1.6.0`. **Do not use this guide for upgrading from `0.7`.**

## Panel Version Requirements

Each version of Pterodactyl Panel also has a corresponding minimum version of Wings that
is required for it to run. Please see the chart below for how these versions line up. In
most cases your base Wings version should match that of your Panel.

| Panel Version | Wings Version | Supported | PHP Versions                  |
| ------------- | ------------- | --------- | ----------------------------- |
| 1.0.x         | 1.0.x         |           | 7.3, 7.4                      |
| 1.1.x         | 1.1.x         |           | 7.3, 7.4                      |
| 1.2.x         | 1.2.x         |           | 7.3, 7.4                      |
| 1.3.x         | 1.3.x         |           | 7.4, 8.0                      |
| 1.4.x         | 1.4.x         |           | 7.4, 8.0                      |
| 1.5.x         | 1.4.x         |           | 7.4, 8.0                      |
| 1.6.x         | 1.4.x         |           | 7.4, 8.0                      |
| 1.7.x         | 1.5.x         |           | 7.4, 8.0                      |
| 1.8.x         | 1.6.x         |           | 7.4, 8.0, 8.1                 |
| 1.9.x         | 1.6.x         |           | 7.4, 8.0, 8.1                 |
| 1.10.x        | 1.7.x         |           | 7.4, 8.0, 8.1                 |
| **1.11.x**    | **1.11.x**    | ✅        | 8.0, **8.1** (8.0 deprecated) |

::: tip Wings releases
There are no 1.8.x, 1.9.x, or 1.10.x releases of Wings.
:::

## Update Dependencies

- PHP `8.0` or `8.1` (recommended)
- Composer `2.X`

::: danger PHP 7.4
Support for PHP 7.4 has been removed with the release of 1.11.0. Please upgrade
to PHP 8.0, 8.1 or newer.
:::

::: warning Future PHP Version Changes
**Support for PHP 8.0 is deprecated**. Please plan accordingly — PHP 8.1 or newer
will be the only supported version in 1.12 and beyond.
:::

**Before continuing**, please ensure that your system and web server configuration has been upgraded to at least PHP 8.0 by running `php -v` and Composer 2 by running `composer --version`. You
should see an output similar to the result below. If you do not see at least PHP 8.0 and Composer 2, you will need to upgrade by following
our [PHP Upgrade Guide](/guides/php_upgrade.md) and return to this documentation afterward.

```
vagrant@pterodactyl:~/app$ php -v
PHP 8.1.5 (cli) (built: Apr 21 2022 10:32:13) (NTS)
Copyright (c) The PHP Group
Zend Engine v4.1.5, Copyright (c) Zend Technologies
    with Zend OPcache v8.1.5, Copyright (c), by Zend Technologies

vagrant@pterodactyl:~/app$ composer --version
Composer version 2.3.5 2022-04-13 16:43:00
```

## Self Upgrade

::: warning
The self-upgrade is currently in-operable due to issues with some dependencies we make use of.
For the time being please perform a manual upgrade until this issue can be resolved.
:::

## Manual Upgrade

If you prefer not to perform the automatic self-upgrade, or need to reference any upgrade steps you can follow
the documentation below.

::: warning
If you've already performed the self-upgrade successfully you do not need to do anything else on this page.
:::

### Enter Maintenance Mode

Whenever you are performing an update you should be sure to place your Panel into maintenance mode. This will prevent
users from encountering unexpected errors and ensure everything can be updated before users encounter
potentially new features.

```bash
cd /var/www/pterodactyl

php artisan down
```

### Download the Update

The first step in the update process is to download the new panel files from GitHub. The command below will download
the release archive for the most recent version of Pterodactyl, save it in the current directory and will automatically
unpack the archive into your current folder.

```bash
curl -L https://github.com/pterodactyl/panel/releases/latest/download/panel.tar.gz | tar -xzv
```

Once all of the files are downloaded we need to set the correct permissions on the cache and storage directories to avoid
any webserver related errors.

```bash
chmod -R 755 storage/* bootstrap/cache
```

### Update Dependencies

After you've downloaded all of the new files you will need to upgrade the core components of the panel. To do this,
simply run the commands below and follow any prompts.

```bash
composer install --no-dev --optimize-autoloader
```

### Clear Compiled Template Cache

You'll also want to clear the compiled template cache to ensure that new and modified templates show up correctly for
users.

```bash
php artisan view:clear
php artisan config:clear
```

### Database Updates

You'll also need to update your database schema for the newest version of Pterodactyl. Running the command below
will update the schema and ensure the default eggs we ship are up to date (and add any new ones we might have). Just
remember, _never edit core eggs we ship_! They will be overwritten by this update process.

```bash
php artisan migrate --seed --force
```

### Set Permissions

The last step is to set the proper owner of the files to be the user that runs your webserver. In most cases this
is `www-data` but can vary from system to system &mdash; sometimes being `nginx`, `caddy`, `apache`, or even `nobody`.

```bash
# If using NGINX or Apache (not on CentOS)
chown -R www-data:www-data /var/www/pterodactyl/*

# If using NGINX on CentOS
chown -R nginx:nginx /var/www/pterodactyl/*

# If using Apache on CentOS
chown -R apache:apache /var/www/pterodactyl/*
```

### Restarting Queue Workers

After _every_ update you should restart the queue worker to ensure that the new code is loaded in and used.

```bash
php artisan queue:restart
```

### Exit Maintenance Mode

Now that everything has been updated you need to exit maintenance mode so that the Panel can resume accepting
connections.

```bash
php artisan up
```

### Telemetry

Since 1.11, Pterodactyl will collect anonymous telemetry to help us better understand how the
software is being used. To learn more about this feature and to opt-out, please see our [Telemetry](./additional_configuration.md#telemetry)
documentation. Remember to continue with the rest of the upgrade.

[Final Step: Upgrade Wings](/wings/1.0/upgrading.md)
