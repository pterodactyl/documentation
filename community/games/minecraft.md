# Minecraft

[[toc]]


# Minecraft Server Networks
## Setting up a BungeeCord network
:::warning
This guide was written with BungeeCord in mind, but should work for Waterfall and Hexacord as well.  
For the setup described below, it is necessary that all servers are on the same node.
:::

### Setting up the BungeeCord server

The ideal setup with BungeeCord is a seperated internal network with only one access point which is the BungeeCord server. Pterodactyl provides this with Docker.
In order to create a BungeeCord network you'll have to add an allocation with which the BungeeCord server should be reachable.

1. Create an allocation with the IP address of the node and the desired port (e.g. 25565, the default Minecraft port) to your node first.
2. Then create a new BungeeCord server and use the allocation you just created.

### Adding servers to the BungeeCord network

You need to add allocations and ports for your Spigot servers to use internally. This will make it so only the BungeeCord server can reach the servers.

1. Create new allocations on the localhost IP address `127.0.0.1` with some ports for the servers to use.
    * You can use a port range, e.g. `30000-30010` which will get you 11 ports.  
2. Then create a new Spigot server and use the allocation you just created.
3. Add the servers to your BungeeCord network, use `172.18.0.1:<port of the internal server>` (not 127.0.0.1) as the IP addresses of the servers to add in your configuration file.

### Server Network Notes

* **Only** the proxy (Waterfall / Hexagon / Bungee) have to be bound to an external IP.
* **No modifications to iptables should be done**
* all servers behind the proxy are safe.

### UFW Firewall

If you are using the ufw firewall, it might be necessary to allow access to specific host ports. The following command allows incoming requests to `172.18.0.1`, which is the IP of the actual host server within the docker network. Replace `<LOCALHOST_PORT>` with any port you want to be accessible. In this case use the port you assigned to the minecraft server you want to add.

```
ufw allow in on pterodactyl0 to 172.18.0.1 port <LOCALHOST_PORT> proto tcp
```

:::warning
The ports you open with this command will be accessible by any server on the same node.
:::