# Upgrading Wings
Upgrading Wings is a painless process and should take less than a minute to complete.

## Download Updated Binary
First, download the updated wings binary into `/srv/wings`.

``` bash
curl -L -o wings https://github.com/pterodactyl/wings/releases/download/v1.0.0-beta.4/wings
chmod u+x wings
```

## Restart Process
Finally, restart the wings process. Your running servers will not be affected and any open
connections to the instance will re-connect automatically.

``` bash
systemctl restart wings
```
