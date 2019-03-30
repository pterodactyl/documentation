# Environment Configuration

[[toc]]

## Reverse Proxy Setup
If you are planning on running Pterodactyl behind a reverse proxy, either using NGINX or because you are using
[Cloudflare's Flexible SSL](https://support.cloudflare.com/hc/en-us/articles/200170416-What-do-the-SSL-options-mean-),
you will need to make a quick modification to the Panel to ensure things continue to work as expected. By default when
you are using these reverse proxies your Panel will not understand how to properly handle requests and you'll most likely
be unable to login, or will see security warnings in your browser console as it attempts to load insecure assets. This
is because the internal logic the Panel is using to determine how links should be generated thinks it is running over
HTTP, and not over HTTPS.

You will need to edit the `.env` file in the Panel's root directory to contain `TRUSTED_PROXIES=*` at minimum. We 
highly suggest providing a specific IP address (or comma seperated list of IPs) rather than allowing `*`. For example,
if your proxy is running on the same machine as the server, chances are that something like `TRUSTED_PROXIES=127.0.0.1`
will work for you.

### Cloudflare Specific Configuration
If you're using Cloudflares Flexible SSL you should set `TRUSTED_PROXIES` to contain [their IP addresses](https://www.cloudflare.com/ips/).
Below is an example of how to set this.

```
TRUSTED_PROXIES=103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/12,108.162.192.0/18,131.0.72.0/22,141.101.64.0/18,162.158.0.0/15,172.64.0.0/13,173.245.48.0/20,188.114.96.0/20,190.93.240.0/20,197.234.240.0/22,198.41.128.0/17
```

we also highly recommend that you add these configuration parameters to the top of your Nginx configuration in order to log the visitor's real ip and manage the opening sessions.

```
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/12;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2c0f:f248::/32;
set_real_ip_from 2a06:98c0::/29;
real_ip_header X-Forwarded-For;
```


## Increasing Editable File Size
By default the Panel attempts to set a reasonable limit for editing files through the web based file manager. However,
some users find it too restrictive and wish to increase the size. This is controlled by a configuration value that can
also be set using the `.env` file. The default value is `50,000` bytes but this can be increased as you see fit.

```
PTERODACTYL_FILES_MAX_EDIT_SIZE=50000
```

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

## Forcing Environment From File
Out of the box Pterodactyl supports reading certain settings from the database rather than the `.env` file. This is
mainly to make configuration easier for administrators, and let you avoid having to SSH into the server to make
changes. However, there are also instances where this behavior might be undesirable &mdash; for example, if you lock
yourself out of the Panel because of a bad reCAPTCHA key.

If you want to force the Panel to read only from `.env` and not use settings stored in the database, add or edit
`APP_ENVIRONMENT_ONLY` in your `.env` file to be `APP_ENVIRONMENT_ONLY=true`. This will ignore settings in the
database, and read only from the environment file. Once you have resolved whatever issues you might be having
you can change it to be `false` to go back to using the database.

### Manually editing the database
If you need to manually edit a setting, you can do so by changing the value in the `settings` table in the Pterodactyl
database. Some values are encrypted however, so you cannot just edit those, you'll either need to provide a new
encrypted value or follow the instructions above for reading from the environment until you fix it manually in the Panel.

## Report All Exceptions
By default Pterodactyl only logs and reports exceptions that are, well, exceptional by nature. There are some exceptions
that we expect to occur such as authentication failures or validation issues. However, in rare instances when developing,
or even on production servers, you might need to have all exceptions logged to detect inconsistent behavior.

To do this, simply set `APP_REPORT_ALL_EXCEPTIONS=true` in your `.env` file. You'll want to turn this off once you've
completed whatever it is you're needing the exceptions for, otherwise your logs will become very large, very quickly.
