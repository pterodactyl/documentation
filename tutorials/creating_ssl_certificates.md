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
This is for advanced users, whose server systems do not have access to port 80. The command below is for Ubuntu distributions and CloudFlare API (you may google for other APIs for other DNS providers), but you can always check [acme.sh's official site](https://github.com/Neilpang/acme.sh) for installation instructions.

``` bash
curl https://get.acme.sh | sh
```

### Obtaining CloudFlare API Key

After installing acme.sh, we need to fetch a CloudFlare API key. Please make sure that a DNS record (A or CNAME record) is pointing to your target node, and set the cloud to grey (bypassing CloudFlare proxy). Then go to My Profile > API keys and on Global API Key subtab, click on "view", enter your CloudFlare password, and copy the API key to clipboard.

### Creating a Certificate

Since the configuration file is based on Certbot, we need to create the folder manually.

```bash
sudo mkdir /etc/letsencrypt/live/example.com
```

After installing acme.sh and obtaining CloudFlare API key, we need to then generate a certificate. First input the CloudFlare API credentials.

```bash
export CF_Key="Your_CloudFlare_API_Key"
export CF_Email="Your_CloudFlare_Account@example.com"

```

Then create the certificate.

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
::::
