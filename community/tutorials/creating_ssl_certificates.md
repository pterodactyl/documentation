# Creating SSL Certificates
These are community manages tutorials on how to generate an ssl cert.


## Cloudflare
This tutorial briefly covers creating new SSL certificates for your panel and daemon using Cloudflare

### Using acme.sh
This is for advanced users, of which their server systems do not have access to port 80. The command below is for Ubuntu distributions and CloudFlare API (you may google for other APIs for other DNS providers), but you can always check [acme.sh's official site](https://github.com/Neilpang/acme.sh) for installation instructions.

``` bash
curl https://get.acme.sh | sh
```

### Obtaining CloudFlare API Key
After installing acme.sh, we need to fetch a CloudFlare API key. Please make sure that a DNS record (A or CNAME record) is pointing to your target node, and set the cloud to grey (bypassing CloudFlare proxy). Then go to My Profile > API keys and on Glocal API Key subtab, click on "view", enter your CloudFlare password, and copy the API key to clipboard.

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
acme.sh --issue --standalone -d "example.com" --dns dns_cf \
--key-file /etc/letsencrypt/live/example.com/privkey.pem \
--fullchain-file /etc/letsencrypt/live/example.com/fullchain.pem 
```
### Auto Renewal
After running the script for the first time, it will be added to the crontab automatically. You may edit the auto renewal interval by editing the crontab.

```bash
sudo crontab -e
```