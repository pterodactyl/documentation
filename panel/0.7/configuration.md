# Environment Configuration

[[toc]]

Pterodactyl's environment settings are configured and stored in an environment file — `.env` — located in the
installation root directory — generally `/var/www/pterodactyl`. Some of these settings are also stored in the database
and will override settings found in the environment file.

To change this behavior you can edit the `.env` file and change the setting `APP_ENVIRONMENT_ONLY=false` to
`APP_ENVIRONMENT_ONLY=true` which will take effect the next time you refresh a page on the Panel. Generally you will
only need to do this if you severly corrupt a setting in the Panel or are deep in development with the software.

## Reporting All Exceptions
By default Pterodactyl only logs and reports exceptions that are, well, exceptional by nature. There are some exceptions
that we expect to occur such as authentication failures or validation issues. However, in rare instances when developing,
or even on production servers, you might need to have all exceptions logged to detect inconsistent behavior.

To do this, simply set `APP_REPORT_ALL_EXCEPTIONS=true` in your `.env` file. You'll want to turn this off once you've
completed whatever it is you're needing the exceptions for, otherwise your logs will become very large, very quickly.

## Client Databases
By default Pterodactyl ships with the ability for clients to have their own per-server databases. If you wish to disable
this ability, set `PTERODACTYL_CLIENT_DATABASES_ENABLED` to be `false`. Pterodactyl also attempts to create databases
on a database host assigned to the current server's node but will use any host if one can't be found. If you would like
to force a database to be created only on a host belonging to that server's node, set `PTERODACTYL_CLIENT_DATABASES_ALLOW_RANDOM`
to be `false`.

```
PTERODACTYL_CLIENT_DATABASES_ENABLED=true
PTERODACTYL_CLIENT_DATABASES_ALLOW_RANDOM=true
```

## Reverse Proxy Setup
If you are planning on running Pterodactyl behind a reverse proxy, either using NGINX or because you are using
[Cloudflare's Flexible SSL](https://support.cloudflare.com/hc/en-us/articles/200170416-What-do-the-SSL-options-mean-),
you will need to make a quick modification to the Panel to ensure things continue to work as expected. By default when
you are using these reverse proxies your Panel will not understand how to properly handle requests and you'll most likely
be unable to login, or will see security warnings in your browser console as it attempts to load insecure assets. This
is because the internal logic the Panel is using to determine how links should be generated thinks it is running over
HTTP, and not over HTTPS.

You will need to edit the `.env` file in the Panel's root directory to contain `TRUSTED_PROXIES=*` at minimum. We 
highly suggest providing a specific IP address (or comma separated list of IPs) rather than allowing `*`. For example,
if your proxy is running on the same machine as the server, chances are that something like `TRUSTED_PROXIES=127.0.0.1`
will work for you.

### NGINX Specific Configuration
For Pterodactyl to properly respond to an NGINX reverse proxy, the NGINX `location` config must contain the following lines:
```
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_redirect off;
proxy_buffering off;
proxy_request_buffering off;
```

### Cloudflare Specific Configuration
If you're using Cloudflare's Flexible SSL you should set `TRUSTED_PROXIES` to contain [their IP addresses](https://www.cloudflare.com/ips/).
Below is an example of how to set this.

```
TRUSTED_PROXIES=103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/12,108.162.192.0/18,131.0.72.0/22,141.101.64.0/18,162.158.0.0/15,172.64.0.0/13,173.245.48.0/20,188.114.96.0/20,190.93.240.0/20,197.234.240.0/22,198.41.128.0/17
```

## Increasing the Editable File Size
By default the Panel attempts to set a reasonable limit for editing files through the web based file manager. However,
some users find it too restrictive and wish to increase the size. This is controlled by a configuration value that can
also be set using the `.env` file. The default value is `50,000` bytes but this can be increased as you see fit.

```
PTERODACTYL_FILES_MAX_EDIT_SIZE=50000
```

## Disable or Modify ReCaptcha
To disable reCAPTCHA on login or password reset, simply set `RECAPTCHA_ENABLED=false` in the environment file. This
change will take effect immediately.

### Using Your Own Keys
Pterodactyl comes preconfigured using a public set of reCAPTCHA keys but you may wish to use your own site
specific keys. To do so, follow the instructions below.

1. Visit [Google's reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin#list).
2. Click "Register New Site" and fill in a name for your keys.
3. Choose `reCAPTCHA v2` and ensure that the option for `Invisible` is selected.
4. Include the domain that your panel is located on.
5. On the next page displayed, locate the "Site Key" and "Secret Key". In Pterodactyl's control panel click on "Settings" and then the "Advanced" tab. Enter the keys in the boxes "Site Key" and "Secret Key", respectively.

::: warning Disabling Domain Verification
If you do not want reCAPTCHA to verify the domain making the validation request you can uncheck "Verify the origin of reCaptcha solution" under "Advanced Settings" after generating your key.
:::
