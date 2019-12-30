# Minecraft

[[toc]]

## Network Configuration
This guide was written for Minecraft Proxy Servers (BungeeCord, Waterfall, HexaCord, etc).

:::warning
For the setup described below, it is necessary that all servers are on the same node.
:::

::: danger
If you are a host you should limit it to a single proxy network on a node if you are selling them to customers.
:::

### Setting up the Network
The ideal setup for this involves a separated internal network with only one access point — the proxy server —
which is an easy configuration with Pterodactyl. In order to create a Bungeecord network you'll first need to add an
allocation to your Node that makes your Bungeecord server publicly accessible. This allocation should be for your
public IP address and the default port you wish to use — generally `25565`.

::: tip
Create a proxy server allocating the host IP and any port you want (mc default being 25565).
:::

### Adding Additional Servers
All other servers that are a part of the network should be created on local interfaces — meaning they are not publicly
accessible. Create new allocations on the localhost IP address `127.0.0.1` with some ports for the servers to use.
You can also enter a port range, e.g. `30000-30010` which will get you 11 ports. 

Now create new servers and be sure to use your internal allocations — `127.0.0.1` — for each of them. To add the
servers to your network you'll use `172.18.0.1:<port>` — or `127.0.0.1` which will automatically be resolved to your
Docker network interface IP — as the IP address in your configuration file.

::: tip
Create a minecraft server allocating 127.0.0.1 in the panel with any port you want
:::

### In Conclusion
* Only the proxy server (Bungeecord/Hexacord/Waterfall) should be attached to your publically accessible IP address.
* You should _not_ make any modifications to IPTables.
* All of the servers behind the proxy are safe from direct _external_ connections, assuming you bind them to `127.0.0.1`.

### Firewalls

:::warning
The ports you open with the following will be accessable by all minecraft servers on the node.
:::

The following commands are to allow access on `<PTERODACTYL_NET>` (default is 172.18.0.1).

#### UFW (ubuntu)
Allow access to the pterodactyl pterodactyl0 network on a specific port.
``` bash
ufw allow in on pterodactyl0 to <PTERODACTYL_NET> port <LOCALHOST_PORT> proto tcp
```

#### Firewalld (centos)
Allow access to pterodactyl0 from the pterodactyl0 network.

``` bash
firewall-cmd --permanent --zone=public --add-source=<PTERODACTYL_NET>
```