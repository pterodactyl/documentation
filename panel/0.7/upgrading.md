# Upgrading
Upgrading the Panel is a relatively simple process. Below you will find a list of articles that will walk you through
the upgrade process for each version of the software.

## Maintenance Mode
Whenever you are performing an upgrade, you should be sure to place your Panel into "maintenance mode". This will prevent
users from encountering unexpected errors, and ensure everything can be upgraded before users encounter potentially new features.

``` bash
# Put the Panel into maintenance mode and deny user access
php artisan down

# Bring the Panel back up to receive connections.
php artisan up
```

## Restarting Queue Workers
After _every_ update, you should restart the queue worker to ensure that the new code is being loaded in and used.

``` bash
php artisan queue:restart
```

## Version Specific Guides

* [0.6.X to 0.7.19](/panel/0.7/upgrade/0.6_to_0.7.md)
* [0.7.X series](/panel/0.7/upgrade/0.7.md)
* [0.7.19 to 1.X.X](/panel/1.X/upgrade/0.7_to_1.x.md) <Badge text="current" vertical="middle"/>