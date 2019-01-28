# Creating SSL Certificates
This tutorial briefly covers creating new SSL certificates for your panel and daemon using LetsEncrypt&trade;. To
begin, we will be installing certbot, a simple script that will automatically renew our certificates and allow much
cleaner creation of them. The command below is for Ubuntu distributions, but you can always check [Certbot's official
site](https://certbot.eff.org/) for installation instructions.
                                                                                                               
``` bash
sudo add-apt-repository ppa:certbot/certbot
sudo apt update
sudo apt install certbot
```

## Creating a Certificate
After installing certbot, we need to then generate a certificate. There are a couple ways to do that, but the
easiest is to have letsencrypt spin-up a temporary web-server to do this. In order for this to work, you will
first need to stop NGINX or Apache.

Then, in the command below, you should replace `example.com` with the domain you would like to generate a certificate
for. If you have multiple domains you would like certificates for, simply add more `-d anotherdomain.com` flags to the
command. You can also look into generating a wildcard certificate but that is not covered in this tutorial.

Once you've generated the certificate you should start NGINX or Apache again to have the certificates applied (assuming
that you've already configured the webservers to use SSL).

``` bash
certbot certonly -d example.com
```

## Auto Renewal
You'll also probably want to configure automatic renewal by adding the command below to a cronjob that runs daily.
You can add the command below to that crontab. For advanced users, we suggest installing and using [acme.sh](https://acme.sh)
which provides more options, and is much more powerful than certbot.

``` text
certbot renew
```

## Troubleshooting
If you get a `Insecure Connection` or related when trying to access your panel, it is likely that the SSL has expired.
This can be easily fixed by renewing the SSL certificate, although using the command
``` text
certbot renew
```
Wont do the job. As it'll give a error such as `Error: Attempting to renew cert (domain) from /etc/letsencrypt/renew/domain.conf produced an unexpected error`.
This will happen especially if your running NGINX instead of Apache, the solution for this is to stop NGINX, renew the certificate then start NGINX once again.
You can do this by running,
```bash
systemctl stop NGINX
```
To stop the NGINX service. Now you need to renew the certificate, you can do this by running,
```bash
certbot renew
```
Wait for the process to complete. 
Once it has, you may now re-start the NGINX service using,
```bash
systemctl start NGINX
```
