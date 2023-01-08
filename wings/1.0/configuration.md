# Additional Configuration

[[toc]]

::: warning
These are advanced configurations for Wings. You risk breaking Wings and making containers unusable if
you misconfigure something. Proceed only if you know what each configuration value does.
:::

You must apply all changes to your Wings `config.yml` file located at `/etc/pterodactyl` and restart wings. Verify your config file using [Yaml Lint](http://www.yamllint.com/) should you receive errors related to YAML parsing.

## Private Registries

You can use these settings to authenticate against (private) docker registries when pulling images.

### Available Keys

| Setting Key | Default Value | Notes             |
| ----------- | :-----------: | ----------------- |
| name        |     null      | Registry address  |
| username    |     null      | Registry username |
| password    |     null      | Registry password |

### Example of usage

```yml
docker:
  registries:
    registry.example.com:
      username: "registryusername"
      password: "registrypassword"
```

## Custom Network Interfaces

You can change the network interface that Wings uses for all containers by editing the network name; it is by default set to `pterodactyl_nw`. For example, to enable Docker host mode change the network name to `host`.

::: warning
Changing network mode to `host` grants Pterodactyl direct access to all machine interfaces and Panel users can bind to any IP or Port even if it's not allocated to their container. You will lose all benefits of Docker network isolation. It is not recommended for public installations that are hosting other users' servers.
:::

### Example of usage

```yml
docker:
  network:
    name: host
    network_mode: host
```

After making changes, the following commands will stop the Wings, remove the Pterodactyl network, and start the Wings again. Run at your own risk.
`systemctl stop wings && docker network rm pterodactyl_nw && systemctl start wings`

## Enabling Cloudflare proxy

Cloudflare proxying of the Wings isn't beneficial since users will be connecting to the machine directly and bypassing any Cloudflare protection. As such, your Node machine IP will still be exposed.

To enable Cloudflare proxy, you must change the Wings port to one of the Cloudflare HTTPS ports with caching enabled (more info [here](https://developers.cloudflare.com/fundamentals/get-started/reference/network-ports/)), such as 8443, because Cloudflare only supports HTTP on port 8080. Select your Node in the Admin Panel, and on the settings tab, change the port. Make sure that you set "Not Behind Proxy" when using Full SSL settings in Cloudflare. Then on Cloudflare dashboard, your FQDN must have an orange cloud enabled beside it.

You are unable to proxy the SFTP port through Cloudflare unless you have their enterprise plan.

## Container PID Limit

You can change the total number of processes that can be active in a container at any given moment by changing the `container_pid_limit` value. The default value is `512`.
You can set it to `0` to disable the limit completely. However, this is _not_ recommended as the limit prevents malicious overloading of the node.
Restart wings and your game server to apply the new limit.

### Example of usage

```yml
docker:
  ...
  container_pid_limit: 512
  ...
```

## Throttles Limits

You can use these settings to adjust or completely disable throttling.

| Setting Key           | Default Value | Notes                                                                                                                               |
| :-------------------- | :-----------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| enabled               |     true      | Whether or not the throttler is enabled                                                                                             |
| lines                 |     2000      | Total lines that can be output in a given line_reset_interval period                                                                |
| maximum_trigger_count |       5       | Amount of times throttle limit can be triggered before the server will be stopped                                                   |
| line_reset_interval   |      100      | The amount of time after which the number of lines processed is reset to 0                                                          |
| decay_interval        |     10000     | Time in milliseconds that must pass without triggering throttle limit before trigger count is decremented                           |
| stop_grace_period     |      15       | Time that a server is allowed to be stopping for before it is terminated forcefully if it triggers output throttle                  |
| write_limit           |       0       | Impose I/O write limit for backups to the disk, 0 = unlimited. Value greater than 0 throttles write speed to the set value in MiB/s |
| download_limit        |       0       | Impose a Network I/O read limit for archives, 0 = unlimited. Value greater than 0 throttles read speed to the set value in MiB/s    |

### Example of usage

```yml
throttles:
  enabled: true
  lines: 2000
  maximum_trigger_count: 5
  line_reset_interval: 100
  decay_interval: 10000
  stop_grace_period: 15
```

## Installer Limits

Defines the limits on the installer containers that prevents a server's installation process from unintentionally consuming more resources than expected. This is used in conjunction with the server's defined limits. Whichever value is higher will take precedence in the install containers.

| Setting Key | Default Value | Notes                                                                                                       |
| :---------- | :-----------: | ----------------------------------------------------------------------------------------------------------- |
| memory      |     1024      | The maximum amount of memory install container can use unless server memory limit is higher than this value |
| cpu         |      100      | The maximum amount of cpu install container can use unless server cpu limit is higher than this value       |

### Example of usage

```yml
installer_limits:
  memory: 1024
  cpu: 100
```

## Other values

More commonly discussed values. View all Wings config values and explanations in [these two files.](https://github.com/pterodactyl/wings/tree/develop/config)

| Setting Key                | Default Value | Notes                                                                                                                                                      |
| -------------------------- | :-----------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| debug                      |     false     | Force Wings to run in debug mode                                                                                                                           |
| tmpfs_size                 |      100      | The size of the /tmp directory in MB when mounted into a container                                                                                         |
| websocket_log_count        |      150      | The number of lines to display in the console                                                                                                              |
| detect_clean_exit_as_crash |     true      | Mark server as crashed if it's stopped without user interaction, e.g., not pressing stop button                                                            |
| (crash detection) timeout  |      60       | Timeout between server crashes that will not cause the server to be automatically restarted                                                                |
| app_name                   | "Pterodactyl" | Changes the name of the daemon, shown in the panel's game console                                                                                          |
| check_permissions_on_boot  |     true      | Check all file permissions on each boot. Disable this when you have a very large amount of files and the server startup is hanging on checking permissions |
