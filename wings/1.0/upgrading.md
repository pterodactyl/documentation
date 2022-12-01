# Upgrading Wings

Upgrading Wings is a painless process and should take less than a minute to complete.

## Wings Version Requirements

Each version of Pterodactyl Panel also has a corresponding minimum version of Wings that
is required for it to run. Please see the chart below for how these versions line up. In
most cases your base Wings version should match that of your Panel.

| Panel Version | Wings Version | Supported |
|---------------|---------------|-----------|
| 1.0.x         | 1.0.x         |           |
| 1.1.x         | 1.1.x         |           |
| 1.2.x         | 1.2.x         |           |
| 1.3.x         | 1.3.x         |           |
| 1.4.x         | 1.4.x         |           |
| 1.5.x         | 1.4.x         |           |
| 1.6.x         | 1.4.x         |           |
| 1.7.x         | 1.5.x         |           |
| 1.8.x         | 1.6.x         |           |
| 1.9.x         | 1.6.x         |           |
| **1.10.x**    | **1.7.x**     | ✅         |
| **1.11.x**    | **1.11.x**    | ✅         |

*NOTE: There are no 1.8.x, 1.9.x, or 1.10.x releases of Wings.*

## Download Updated Binary

First, download the updated wings binary into `/usr/local/bin`. You will need to stop Wings briefly. _Your running
servers **will not** be affected._

``` bash
systemctl stop wings
curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
chmod u+x /usr/local/bin/wings
```

## Restart Process

Finally, restart the wings process. Your running servers will not be affected and any open
connections to the instance will re-connect automatically.

``` bash
systemctl restart wings
```
