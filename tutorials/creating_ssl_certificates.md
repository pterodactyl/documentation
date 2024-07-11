# Creating SSL Certificates

This tutorial briefly covers creating new SSL certificates for your panel and wings.

:::: tabs
::: tab "Method 1: Certbot"
To begin, we will install certbot, a simple script that automatically renews our certificates and allows much
easier creation of them. The command below is for Ubuntu distributions, but you can always check [Certbot's official
site](https://certbot.eff.org/) for installation instructions. We have also included a command below to install certbot's
Nginx/Apache plugin so you won't have to stop your webserver.

``` bash
sudo apt update
sudo apt install -y certbot
# Run this if you use Nginx
sudo apt install -y python3-certbot-nginx
# Run this if you use Apache
sudo apt install -y python3-certbot-apache
```

## Creating a Certificate

After installing the certbot, we need to generate a certificate. There are a couple of ways to do that, but the easiest
is to use the web server-specific certbot plugin you just installed. For Wings-only machines that don't need a web server, use the standalone or DNS method of the certbot as you don't need a web server for it.

Then, in the command below, you should replace `example.com` with the domain you would like to generate a certificate
for.  When you have multiple domains you would like certificates for, simply add more `-d anotherdomain.com` flags to the
command. You can also look into generating a wildcard certificate but that is not covered in this tutorial.

When you are using certbot's Nginx/Apache plugin, you won't need to restart your webserver to have the certificate
applied assuming that you've already configured the webservers to use SSL as instructed in the [web server configuration step](https://pterodactyl.io/panel/1.0/webserver_configuration.html).

### HTTP challenge

HTTP challenge requires you to expose port 80 for the challenge verification.

``` bash
# Nginx
certbot certonly --nginx -d example.com
# Apache
certbot certonly --apache -d example.com
# Standalone - Use this if neither works. Make sure to stop your webserver first when using this method.
certbot certonly --standalone -d example.com
```

### DNS challenge

DNS challenge requires you to create a new TXT DNS record to verify domain ownership, instead of having to expose port 80. The instructions are displayed when you run the certbot command below.

```bash
certbot -d example.com --manual --preferred-challenges dns certonly
```

### Auto Renewal

You'll also probably want to configure the automatic renewal of certificates to prevent unexpected certificate expirations.
You can open crontab with `sudo crontab -e` and add the line from below to the bottom of it for attempting renewal every day at 23 (11 PM).

Deploy hook would restart the Nginx service to apply a new certificate when it's renewed successfully. Change `nginx` in the restart command to suit your own needs, such as to `apache` or `wings`.

For advanced users, we suggest installing and using [acme.sh](https://acme.sh)
which provides more options, and is much more powerful than certbot.

``` text
0 23 * * * certbot renew --quiet --deploy-hook "systemctl restart nginx"
```

### Troubleshooting

If you get an `Insecure Connection` or SSL/TLS related error when trying to access your panel or wings, the certificate has likely expired.
This can be easily fixed by renewing the SSL certificate, although using the command `certbot renew` might not do the job if port 80 is in use, as it'll return errors like: `Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`.

This will happen especially if you're running Nginx instead of Apache. The solution for this is to use Nginx or Apache plugins with `--nginx` and `--apache`. Alternatively, you can stop Nginx, then renew the certificate, finally restart Nginx. Replace `nginx` with your own web server or with `wings` should you be renewing the certificate for Wings.

Stop Nginx:

```bash
systemctl stop nginx
```

Renew the certificate:

```bash
certbot renew
```

Once the process has complete, you can restart the Nginx service:

```bash
systemctl start nginx
```
You may also need to restart Wings as not every service is able to automatically apply an updated certificate:

```bash
systemctl restart wings
```

:::
::: tab "Method 2: acme.sh (using Cloudflare API)"
This is for advanced users, whose server systems do not have access to port 80. The command below is for Ubuntu distributions and CloudFlare API (you may google for other APIs for other DNS providers), but you can always check [acme.sh's official site](https://github.com/Neilpang/acme.sh) for installation instructions. Make sure you read both instructions, as some people may have moved to CloudFlare's [new authorization system](https://blog.cloudflare.com/permissions-best-practices) (Modern), but other's [have not](https://community.cloudflare.com/t/cannot-add-new-member-error-1005/421516) (Legacy). 

``` bash
curl https://get.acme.sh | sh
```

### Obtaining CloudFlare API Key (Legacy)

After installing acme.sh, we need to fetch a CloudFlare API key. On Cloudfare's website, select your domain, then on the right side, copy your "Zone ID" and "Account ID" then click on "Get your API token", click on "Create Token" > select the template "Edit zone DNS" > select the scope of "Zone Resources" and then click on "Continue to summary", copy your token.

### Creating a Certificate

Since the configuration file is based on Certbot, we need to create the folder manually.

```bash
sudo mkdir -p /etc/letsencrypt/live/example.com
```

After installing acme.sh and obtaining CloudFlare API key, we need to then generate a certificate. First input the CloudFlare API credentials.

```bash
export CF_Token="Your_CloudFlare_API_Key"
export CF_Account_ID="Your_CloudFlare_Account_ID"
export CF_Zone_ID="Your_CloudFlare_Zone_ID"
```


### Obtaining CloudFlare API Key (Modern)

After installing acme.sh, we need to fetch a CloudFlare API key. On Cloudfare's website, click on your profile on the top right. Then go to "My Profile", on the left you will find "API Tokens". Click it and it'll bring you to [the api tokens page](https://dash.cloudflare.com/profile/api-tokens). Select "Create Token" and use the "Edit zone DNS" template. Then once on the next page, goto "Zone Resources" and "Include" - "Specific Zone" - (Select the domain you want to use). Then continue to the summery. Confirm you'd like to create the token.

### Creating a Certificate

Since the configuration file is based on Certbot, we need to create the folder manually.

```bash
sudo mkdir -p /etc/letsencrypt/live/example.com
```

After installing acme.sh and obtaining CloudFlare API key, we need to then generate a certificate. First input the CloudFlare API credentials.

```bash
export CF_Key="Your_CloudFlare_API_Key"
export CF_Email="Your_CloudFlare_Email"
```

Then create the certificate. Since the API key is bound to the domain, Cloudflare should allow you to generate one.

```bash
acme.sh --issue --dns dns_cf -d "example.com" --server letsencrypt \
--key-file /etc/letsencrypt/live/example.com/privkey.pem \
--fullchain-file /etc/letsencrypt/live/example.com/fullchain.pem
```

### Auto Renewal

After running the script for the first time, it will be added to the crontab automatically. You may edit the auto renewal interval by editing the crontab.

```bash
sudo crontab -e
```

:::
::: tab "Method 3: Caddy (using Cloudflare API)"
This is for advanced users, who are running Cloudflare in proxy mode or do not have access to port `80`.

### Installing Caddy with Cloudflare DNS plugin

Caddy does not come by default with Cloudflare DNS plugin, you need to install it yourself.

There are two main methods:

1. Using `xcaddy` - CLI tool to build your own Caddy build
2. Downloading prebuilt binary from [Caddy's download page](https://caddyserver.com/download).
3. Using Ansible to download and install Caddy with plugins. See [caddy-ansible](https://github.com/caddy-ansible/caddy-ansible)

#### Build Caddy using `xcaddy` on your server

Please refer to [Caddy docs on building Caddy](https://caddyserver.com/docs/build#xcaddy).

### Obtaining CloudFlare API Token

After installing acme.sh, we need to fetch a CloudFlare API key. Please make sure that a DNS record (A or CNAME record) is pointing to your target node, and set the cloud to grey (bypassing CloudFlare proxy). Then go to My Profile > API keys and on Global API Key subtab, click on "view", enter your CloudFlare password, and copy the API key to clipboard.

After install Caddy with Cloudflare DNS plugin, we need to fetch a Cloudflare API token. Please make sure that a DNS record (A or CNAME record) is pointing at your target node. Then go to My Profile > API Tokens and on API Tokens click "Create Token". Create API Token > API token templates, at the end of line with "Edit zone DNS", click "Use template". Under **Zone Resources**, select your DNS zone for which you wish to create the API token, click "Continue to summary". Review the API token summary and click "Create Token". And finally copy the API token to clipboard.

### Reconfiguring Caddy to use Cloudflare DNS for obtaining certificates

Create an environment variable file (like `.env`), keep in mind that this file contains secrets and should not be accessed by public.

We recommend that you create the secret file in the following location: `/etc/caddy/.secrets.env`.

```bash
CLOUDFLARE_API_TOKEN=<your cloudflare api token>
```

For security reasons, we recommend setting permissions to `0600` (only owner can read or write to the file).

```bash
# Set ownership of the `.secrets.env` file to `caddy` system user
chown caddy:caddy /etc/caddy/.secrets.env

# Set read-write permissions only to owner - the `caddy` system user
chmod 0600 /etc/caddy/.secrets.env
```

Modify the systemd unit file, to load environment variables from file (add `--envfile /etc/caddy/.secrets.env` flag to `ExecStart`), the default systemd unit file location is `/etc/systemd/system/caddy.service`:

```unit{12}
[Unit]
Description=Caddy
Documentation=https://caddyserver.com/docs/
After=network.target network-online.target
Requires=network-online.target

[Service]
Type=notify
User=caddy
Group=caddy
ExecStart=/usr/bin/caddy run --environ --envfile /etc/caddy/.secrets.env --config /etc/caddy/Caddyfile
ExecReload=/usr/bin/caddy reload --config /etc/caddy/Caddyfile
TimeoutStopSec=5s
LimitNOFILE=1048576
LimitNPROC=512
PrivateTmp=true
ProtectSystem=full
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
```

You can add a `tls` block to your `Caddyfile`, under the `<domain>` block of your panel configuration, the Caddy config file location is `/etc/caddy/Caddyfile`:

```caddyfile{5-7}
<domain> {
  # ...

  tls {
    dns cloudflare {env.CLOUDFLARE_API_TOKEN}
  }
}
```

:::
::::
