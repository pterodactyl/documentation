# Additional Configuration

[[toc]]

::: warning
These are advanced configurations for Wings. You risk breaking Wings and making containers unusable if
you misconfigure something. Proceed only if you know what each configuration value does.
:::

You must apply all changes to your wings `config.yml` file located at `/etc/pterodactyl`. Verify your config file using [Yaml Lint](http://www.yamllint.com/) should you receive errors related to YAML parsing.

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
Changing network mode to `host` grants Pterodactyl direct access to all machine interfaces and binding to any IP or Port even if it's not allocated to the container. You will lose all benefits of Docker network isolation. It is not recommended for public installations that are hosting other users' servers.
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

Cloudflare proxying of the wings isn't beneficial since users will be connecting to the machine directly and bypassing any Cloudflare protection. As such, your Node machine IP will be exposed.

You must change the Wings port to one of the Cloudflare HTTPS ports, such as 8443, because Cloudflare doesn't support HTTPS on port 8080. You will be unable to connect to the SFTP through the proxy with Cloudflare unless you have their enterprise plan.

## Console Throttles

You can use these settings to adjust or completely disable throttling.

| Setting Key           | Default Value | Notes                                                                                                              |
| :-------------------- | :-----------: | ------------------------------------------------------------------------------------------------------------------ |
| enabled               |     true      | Whether or not the throttler is enabled                                                                            |
| lines                 |     2000      | Total lines that can be output in a given line_reset_interval period                                               |
| maximum_trigger_count |       5       | Amount of times throttle limit can be triggered before the server will be stopped                                  |
| line_reset_interval   |      10       | Total lines that can be output in a given line_reset_interval period                                               |
| decay_interval        |     10000     | Time in milliseconds that must pass without triggering throttle limit before trigger count is decremented          |
| stop_grace_period     |      15       | Time that a server is allowed to be stopping for before it is terminated forcefully if it triggers output throttle |

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

## Other values

More commonly discussed values. View all Wings config values and explanations in [these two files.](https://github.com/pterodactyl/wings/tree/develop/config)

| Setting Key                | Default Value | Notes                                                                                           |
| -------------------------- | :-----------: | ----------------------------------------------------------------------------------------------- |
| debug                      |     false     | Force Wings to run in debug mode                                                                |
| tmpfs_size                 |      100      | The size of the /tmp directory in MB when mounted into a container                              |
| websocket_log_count        |      150      | The number of lines to display in the console                                                   |
| detect_clean_exit_as_crash |     true      | Mark server as crashed if it's stopped without user interaction, e.g., not pressing stop button |
| (crash detection) timeout  |      60       | Timeout between server crashes that will not cause the server to be automatically restarted     |
