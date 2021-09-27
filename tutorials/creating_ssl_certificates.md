# Creating SSL Certificates
This tutorial briefly covers creating new SSL certificates for your panel and daemon. 

:::: tabs
::: tab "Method 1: Certbot"
To begin, we will be installing certbot, a simple script that will automatically renew our certificates and allow much
cleaner creation of them. The command below is for Ubuntu distributions, but you can always check [Certbot's official
site](https://certbot.eff.org/) for installation instructions. We have also included a command below to install certbot's
NGINX/Apache plugin so you won't have to stop your webserver.
                                                                                                               
``` bash
sudo apt update
sudo apt install -y certbot
# Run this if you use Nginx
sudo apt install -y python3-certbot-nginx
# Run this if you use Apache
sudo apt install -y python3-certbot-apache
```

### Creating a Certificate
After installing certbot, we need to then generate a certificate. There are a couple ways to do that, but the easiest
is to use the webserver-specific certbot plugin you just installed.

Then, in the command below, you should replace `example.com` with the domain you would like to generate a certificate
for. If you have multiple domains you would like certificates for, simply add more `-d anotherdomain.com` flags to the
command. You can also look into generating a wildcard certificate but that is not covered in this tutorial.

Since we are using certbot's NGINX/Apache plugin, you won't need to restart your webserver to have the certificate
applied (assuming that you've already configured the webservers to use SSL).

``` bash
# Nginx
certbot certonly --nginx -d example.com
# Apache
certbot certonly --apache -d example.com
# Standalone - Use this if neither works. Make sure to stop your webserver first when using this method.
certbot certonly --standalone -d example.com
```

### Auto Renewal
You'll also probably want to configure automatic renewal by adding the command below to a cronjob that runs daily.
You can add the command below to that crontab. For advanced users, we suggest installing and using [acme.sh](https://acme.sh)
which provides more options (see below), and is much more powerful than certbot.

``` text
certbot renew
```

### Troubleshooting
If you get an `Insecure Connection` or related error when trying to access your panel, it is likely that the SSL certificate has expired.
This can be easily fixed by renewing the SSL certificate, although using the command `certbot renew` won't do the job. As it'll give a error like: `Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`.
This will happen especially if you're running NGINX instead of Apache. The solution for this is to stop NGINX, then renew the certificate, finally restart NGINX.

Stop NGINX:
```bash
systemctl stop nginx
```

Renew the certificate:
```bash
certbot renew
```

Once the process has complete, you can restart the NGINX service:
```bash
systemctl start nginx
```

:::
::: tab "Method 2: acme.sh (Cloudflare)"
This is for advanced users, of which their server systems do not have access to port 80. The command below is for Ubuntu distributions and CloudFlare API (you may google for other APIs for other DNS providers), but you can always check [acme.sh's official site](https://github.com/Neilpang/acme.sh) for installation instructions.

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

After installing certbot and obtaining CloudFlare API key, we need to then generate a certificate. First input the CloudFlare API credentials.

```bash
export CF_Key="Your_CloudFlare_API_Key"
export CF_Email="Your_CloudFlare_Account@example.com"
```
Then create the certificate.

```bash
acme.sh --issue --dns dns_cf -d "example.com" \
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
