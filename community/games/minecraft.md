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
#### Allocations in panel
When setting up a minecraft network in the panel you will need to add allocations for bungee (external IP 10.1.70.62 in the example), and the game servers (127.0.0.1).
#### example allocations in panel
![](../../.vuepress/public/community/games/minecraft/proxy/node-allocations.png)

#### proxy settings
##### bungeecord/waterfall config
This will differ for other proxy software
![](../../.vuepress/public/community/games/minecraft/proxy/bungee-config.png)

#### paper/spigot/bukkit settings
This will differ for other server software

##### server.properties
set online-mode `false`
![](../../.vuepress/public/community/games/minecraft/proxy/paper-server.properties.png)

##### spigot.yml
set bungeecord to `true`
![](../../.vuepress/public/community/games/minecraft/proxy/paper-spigot.yml.png)

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