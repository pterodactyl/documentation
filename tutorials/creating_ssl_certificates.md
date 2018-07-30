# Creating SSL Certificates
::: warning
This is not needed when running a automatic-ssl webserver like caddy.
:::

This tutorial briefly covers creating new SSL certificates for your panel and daemon using LetsEncrypt&trade;. To
begin, we will be installing certbot, a simple script that will automatically renew our certificates and allow much
cleaner creation of them. The command below is for Ubuntu distributions, but you can always check [Certbot's official
site](https://certbot.eff.org/) for installation instructions.
                                                                                                               
``` bash
sudo apt-get install letsencrypt
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
letsencrypt certonly -d example.com
```

## Auto Renewal
You'll also probably want to configure automatic renewal by adding the command below to a cronjob that runs daily.
You can add the command below to that crontab. For advanced users, we suggest installing and using [acme.sh](https://acme.sh)
which provides more options, and is much more powerful than certbot.
::: warning
Make sure to disable your webserver or setup auto renewal by dns using tools like [acme.sh](https://acme.sh).
:::

stop the webserver:
``` text
# apache users
service apache2 stop
# nginx users
service nginx stop
```
renew your certificate
``` text
letsencrypt renew
```
start your webserver again:
``` text
# apache users
service apache2 start
# nginx users
service nginx start
```
