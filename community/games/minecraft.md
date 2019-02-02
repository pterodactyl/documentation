# Minecraft

[[toc]]

## Network Configuration
This guide was written for Bungeecord, but should work fine for Waterfall and Hexacord servers.

:::warning
For the setup described below, it is necessary that all servers are on the same node.
:::

### Setting up the Network
The ideal setup for this involves a separated internal network with only one access point — the BungeeCord server —
which is an easy configuration with Pterodactyl. In order to create a Bungeecord network you'll first need to add an
allocation to your Node that makes your Bungeecord server publicly accessible. This allocation should be for your
public IP address and the default port you wish to use — generally `25565`.

### Adding Additional Servers
All other servers that are a part of the network should be created on local interfaces — meaning they are not publicly
accessible. Create new allocations on the localhost IP address `127.0.0.1` with some ports for the servers to use.
You can also enter a port range, e.g. `30000-30010` which will get you 11 ports. 

Now create new servers and be sure to use your internal allocations — `127.0.0.1` — for each of them. To add the
servers to your network you'll use `172.18.0.1:<port>` — or `127.0.0.1` which will automatically be resolved to your
Docker network interface IP — as the IP address in your configuration file.

### In Conclusion
* Only the proxy server (Bungeecord/Hexacord/Waterfall) should be attached to your publically accessible IP address.
* You should _not_ make any modifications to IPTables.
* All of the servers behind the proxy are safe from direct _external_ connections, assuming you bind them to `127.0.0.1`.

### UFW Firewall
If you are using a `ufw` firewall, it might be necessary to allow access to specific host ports. The following command
allows incoming requests to `172.18.0.1`, which is the IP of the actual host server within the docker network. Replace
`<LOCALHOST_PORT>` with any port you want to be accessible. In this case use the port you assigned to the minecraft
server you want to add.

:::warning
The ports you open with this command will be accessible by any server _on the same node_.
:::

```
ufw allow in on pterodactyl0 to 172.18.0.1 port <LOCALHOST_PORT> proto tcp
```
