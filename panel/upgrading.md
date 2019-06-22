# Upgrading
Upgrading the Panel is a relatively simple process. Below you will find a list of articles that will walk you through
the upgrade process for each version of the software.

## Maintenance Mode
Whenever you are performing an upgrade you should be sure to place your Panel into maintenance mode. This will prevent
users from encountering unexpected errors and ensure everything can be upgraded before users being encountering
potentially new features.

``` bash
# Put the Panel into maintenance mode and deny user access
php artisan down

# Bring the Panel back up to receive connections.
php artisan up
```

## Restarting Queue Workers
After _every_ update you should restart the queue worker to ensure that the new code is loaded in and used.

``` bash
php artisan queue:restart
```

## Version Specific Guides

* [0.6.X to 0.7.14](/panel/upgrade/0.6_to_0.7.md)
* [0.7.X series](/panel/upgrade/0.7.md) <Badge text="current" vertical="middle"/>
<!--* [0.7.X to 0.8.0](#) <Badge text="beta" type="warn" vertical="middle"/>-->
