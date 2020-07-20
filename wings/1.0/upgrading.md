# Upgrading Wings
Upgrading Wings is a painless process and should take less than a minute to complete.

## Move Old Settings
::: warning
As of `wings@1.0.0-beta.5` we have moved the default location for the configuration
to be in `/etc/pterodactyl`. Please take note of this when performing the upgrade!
:::

This process only needs to be executed if upgrading from `wings@1.0.0-beta.4` or before. You can
skip to the download process below if you're already on at least `beta.5`.

``` bash
# Create the new pterodactyl data directory.
mkdir -p /etc/pterodactyl

# Update the service configuration file to point to the new directory.
sed -i 's;/srv/wings;/etc/pterodactyl;g' /etc/systemd/system/wings.service

#Reload the Systemd daemon service to update the changed service file
systemctl daemon-reload
```

You may optionally move the configuration file over into `/etc/pterodactyl` at this time, or allow
the daemon to move it automatically for you. I recommend moving it now, and then deleting the `/srv/wings`
directory as it is no longer needed.

## Download Updated Binary
First, download the updated wings binary into `/usr/local/bin`.

``` bash
curl -L -o /usr/local/bin/wings https://github.com/pterodactyl/wings/releases/download/v1.0.0-beta.8/wings_linux_amd64
chmod u+x /usr/local/bin/wings
```

::: warning
Previously this guide recommended to place the `wings` binary in `/etc/pterodactyl`, which is against best practices.
You should delete `/etc/pterodactyl/wings` after downloading the latest binary to `/usr/local/bin`.
:::

## Restart Process
Finally, restart the wings process. Your running servers will not be affected and any open
connections to the instance will re-connect automatically.

``` bash
systemctl restart wings
```
