# Standalone SFTP Server

::: danger This Software is Abandoned
This documentation is for **abandoned software** which does not recieve any security updates or support
from the community. This documentation has been left accessible for historial reasons.

You should be installing and using [Wings](/wings/1.0/installing.md) in production environments with
[Pterodactyl Panel 1.0](/panel/1.0/getting_started.md).
:::

::: warning
Standalone SFTP support was introduced in `Panel@v0.7.11` and `Daemon@v0.6.8` and will not work with prior versions.
:::

Pterodactyl now ships with the option to use a [standalone SFTP server](https://github.com/pterodactyl/sftp-server)
rather than using the one that was built into the Daemon. This provides better compatibility with SFTP clients, improved
transfer speeds, and a more native approach to file handling and server operation.

Because this functionality is new, we've decided to make it an opt-in process, rather than an opt-out process. This page
will cover how to setup your standalone SFTP server.

## Disable Daemon's Server
To disable the Daemon SFTP server, you only need to add `sftp.enabled=false` to your Daemon's `core.json` file.

```json
{
  ...
  "sftp": {
    ...
    "ip": "0.0.0.0",
    "enabled": false,
    "port": 2022,
    ...
  },
  ...
}
```

Once you've done that, restarting the Daemon will apply the change and not boot the built-in server.

## Run the Standalone Server
To download the standalone server, execute the command below in your Daemon's base directory (generally `/srv/daemon`).

``` sh
curl -Lo sftp-server https://github.com/pterodactyl/sftp-server/releases/download/v1.0.5/sftp-server
chmod +x sftp-server
```

Excellent, now you've got the server binary. Because we've written this server using [`go`](https://golang.org) there
are no additional dependencies you need to install.

### Start the Server
Finally, start the SFTP server so that you can then use it to access your files.

``` sh
./sftp-server
```

By default, this will start the SFTP server on the old port of `2022`. If you want to use a different port it can be
specified by passing the `--port` flag. For more advanced usage, please refer to the [GitHub README](https://github.com/pterodactyl/sftp-server/tree/release/v1.0.4#running)
which includes all of the flags and their default values.

## Daemonize Server
Chances are you'll want to daemonize the SFTP server using something like `systemd` so that it will run in the
background. Place the contents below in a file called `pterosftp.service` in the `/etc/systemd/system` directory.

``` text
[Unit]
Description=Pterodactyl Standalone SFTP Server
After=wings.service

[Service]
User=root
WorkingDirectory=/srv/daemon
LimitNOFILE=4096
PIDFile=/var/run/wings/sftp.pid
ExecStart=/srv/daemon/sftp-server
Restart=on-failure
StartLimitInterval=600

[Install]
WantedBy=multi-user.target
```

Then, run the command below to enable it in systemd and start the SFTP server.

``` bash
systemctl enable --now pterosftp
```

### Customizing Startup
If you're trying to pass additional arguments to the server when starting it using SystemD you'll want to modify
the `ExecStart` line. Something like `ExecStart=/srv/daemon/sftp-server --port 2022` for example.
