# Additional Configuration

::: danger This Software is Abandoned
This documentation is for **abandoned software** which does not recieve any security updates or support
from the community. This documentation has been left accessible for historial reasons.

You should be installing and using [Wings](/wings/1.0/installing.md) in production environments with
[Pterodactyl Panel 1.0](/panel/1.0/getting_started.md).
:::

[[toc]]

::: warning
These are advanced configurations for the daemon. You risk breaking your daemon and making containers un-usable if
you modify something incorrectly. Proceed at your own risk, and only if you know what each configuration value does.
:::

The documentation below uses dot-notated JSON to explain where each setting should live. You will need to manually
expand this syntax when adding to the `core.json` file for the Daemon. For example, something like `internals.throttle.enabled`
would be expanded to the JSON below.

``` json
{
  "internals": {
    "throttle": {
      "enabled": true
    }
  }
}
```

## Output Throttles
There are a few throttle limits built into the Daemon to keep people from causing issues with data volume and CPU usage.
Under normal circumstances users should not encounter these limits. You might see the occasional data throttling
warning while starting a server or when there is a sudden spike in data output.

If you're seeing more servers than you expected being killed as a result of the Daemon throttler, you can make
adjustments to the settings below. Please note the configs below are in JSON dot-notation and should be expanded
out into a normal JSON object.

| Setting Path | Default Value | Notes |
| ------------ | ------------- | ----- |
| `enabled` | true | Determines if the throttle (and associated values below) should be used. |
| `kill_at_count` | 5 | The number of warnings that can accumulate for a particular instance before the server process is killed. The decay time below affects how quickly this value is decreased. |
| `decay` | 10 | The number of seconds that a server process must go without triggering a data throttle warning before the throttle count begins decreasing. This loop is processed every 5 seconds and will decrement the throttle count by one when the process goes more than this number of seconds without a data throttle occurring. |
| `bytes` | 30720 | :warning: _(removed in v0.5.5)_ The maximum number of bytes of data that can be output in the defined interval before a warning occurs. |
| `lines` | 1000 | :warning: _(added in v0.5.6)_ The number of lines that can be output by the server process in the defined check interval time. By default, 5,000 lines in ~500ms results in a server process kill. |
| `check_interval_ms` | 100 | The number of milliseconds between the throttle resetting the used bytes or line count. |

Please note that all of the settings above are in the `internals.throttle.X` path. So, `enabled` is actually `internals.throttle.enabled`.

## Custom Network Interfaces
If for whatever reason you need to modify the network interfaces used for Pterodactyl's local Docker network you
can do so by modifying the `core.json` file for the daemon. In most cases you'll just be modifying the network
name to allow your servers to use the host network stack. To do so, just change `docker.network.name` to be `host`
rather than `pterodactyl_nw` as shown below.

::: warning
While changing to the host network stack does allow servers running on Pterodactyl to have direct access to local
interfaces and bind to specific IP addresses (required for some Steam games), it is not recommended on public
installations of Pterodactyl (where you have other users running servers).

Using the `host` stack removes many network specific protections afforded by Docker, and will allow server processes
to access anything on the host, as well as bind to any IP or Port they wish.
:::

::: danger
Any changes to the network after the daemon has been started will require you to remove the docker network and restart the daemon. Any servers on the host need to be stopped before and most likely rebuilt.

The following will stop the daemon, remove the network, and start the daemon again. Run at your own risk.  
`systemctl stop wings && docker network rm pterodactyl_nw && systemctl start wings`
:::

``` json{5}
"docker": {
    "socket": "/var/run/docker.sock",
    "autoupdate_images": true,
    "network": {
      "name": "pterodactyl_nw",
      "interfaces": {
        "v4": {
          "subnet": "172.18.0.0/16",
          "gateway": "172.18.0.1"
        }
      }
    },
    "interface": "172.18.0.1"
},
```

## Private Registries
| Setting Path | Default Value | Notes |
| ------------ | ------------- | ----- |
| `username` | _none_ | The username to use when connecting to the registry. |
| `password` | _none_ | The password associated with the account. |
| `images` | _none_ | An array of images that are associated with the private registry. |
| `auth` | _none_ | |
| `email` | _none_ | |
| `serveraddress` | _none_ | The address to the server the registry is located on. |
| `key` | _none_ | A pre-generated base64 encoded authentication string. If provided none of the above options are required. |

Please note that all of the settings above are in the `docker.registry.X` path. So, `username` is actually `docker.registry.username`.

## Security Policies
This daemon ships with a very strict security configuration designed to limit access to the host system, and mitigate
a large range of potential attack vectors. However, some users might need to tweak these settings, or are running on
a private instance and are willing to decrease some of the security measures.

| Setting Path | Default Value | Notes |
| ------------ | ------------- | ----- |
| `ipv6` | true | Set this to false to disable IPv6 networking on the pterodactyl0 interface. |
| `internal` | false | Set this to true to prevent any external network access to all containers on the pterodactyl0 interface. |
| `enable_icc` | true | Set this to false to disallow containers to access services running on the host system's non-public IP addresses. Setting this to false does make it impossible to connect (from a container) to MySQL/Redis/etc. running on the host system without using the public IP address. |
| `enable_ip_masquerade` | true | Set this to false to disable IP Masquerading on the pterodactyl0 interface. |

Please note that all of the settings above are in the `docker.policy.network.X` path. So, `ipv6` is actually `docker.policy.network.ipv6`.

## Container Policy
| Setting Path | Default Value | Notes |
| ------------ | ------------- | ----- |
| `tmpfs` | `rw,exec,nosuid,size=50M` | These are the arguments used for mounting a `tmpfs` directory into containers to allow certain programs to run. |
| `log_driver` | none | :warning: This option was **removed** in `v0.6` and is forcibly set to `json-file`. The log driver to use for containers. We default to `none` to mitigate a potential DoS attack vector if a server were to spam log output. |
| `log_opts` | array | |
| `log_opts.max_size` | `5m` | The maximum size of the server output log file created by Docker. |
| `log_opts.max_files` | `1` | The maximum number of files that Docker will create with output from the server. |
| `readonly_root` | true | Determines if the root filesystem of the container should be readonly. |
| `securityopts` | array | An array of security options to apply to a container. The default array is provided below. |
| `cap_drop` | array | An array of linux capabilities to drop from the container (in addition to ones [dropped by docker already](https://docs.docker.com/engine/security/security/#linux-kernel-capabilities). A listing of the default array is below. |

Please note that all of the settings above are in the `docker.policy.container.X` path. So, `tmpfs` is actually `docker.policy.container.tmpfs`.

### Default Security Opts Array
``` json
[
    'no-new-privileges',
]
```

### Default Capabilities Drop Array

::: warning
Starting with `v0.6` of the Daemon, the following previously _dropped_ capabilities are available in containers: `chown`, `kill`, `setgid`, and `setuid`.
:::

``` json
[
    'setpcap',
    'mknod',
    'audit_write',
    'net_raw',
    'dac_override',
    'fowner',
    'fsetid',
    'net_bind_service',
    'sys_chroot',
    'setfcap',
]
```

## Enabling Cloudflare

Enabling Cloudflare on the daemon isn't particularly useful since users do not connect directly to the daemon port, and users need an unproxied hostname to access any servers on the node.  As a result it's not possible to conceal the IP address of your node machine, but some people want to enable it regardless.

Cloudflare only proxies the default daemon port (8080) when using HTTP.  In order to get the daemon to work with Cloudflare when HTTPS is enabled you must change the daemon port to one that Cloudflare will proxy such as 8443.  Since Cloudflare only proxies HTTP/HTTPS traffic for non-enterprise plans you cannot proxy the SFTP port.
