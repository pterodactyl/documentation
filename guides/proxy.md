# Installing Wings behind a proxy

If you are installing wings behind a reverse proxy, here are some additional tips to help you get started.

## To SSL or not to SSL?

If *at any point* you use an HTTPS connection, pterodactyl will think you are using SSL. 
When running behind a reverse proxy, you should install it _without SSL_ - as your SSL certificates will be managed by your proxy manager (Assuming that the network the installation targets are on are secure and do not require encryption). There are, however, a few things to take note of.


## Firewall/Proxy configuration

The beauty of a proxy is that you only need two ports exposed - 80 (HTTP) and 443 (HTTPS). This holds true for pterodactyl.
You should have ports 80 and 443 on your proxy accessible from WAN (the internet/your public IP). 
You should have two domain names, both of which point to your proxy.
On your proxy, have the following proxy hosts configured:
```
https://panel.example.com -> [Proxy] -> http://0.0.0.0:80
https://wing.example.com -> [Proxy] -> http://0.0.0.0:443
```
Replace `0.0.0.0` with the private IP address of your server - i.e. `192.168.1.30`

When installing the panel, do not use SSL - this will be managed by your proxy.
When installing the wing, set the daemon port to 443. This makes the panel send API requests to `https://wing.example.com:443`, which is picked up by your proxy. The proxy will then redirect that to your wing on port 443.

Make sure to request SSL certificates for both your domains.

When installing a wing (node), set the following configuration:
Use SSL: Use SSL Connection
Behind Proxy: Behind Proxy