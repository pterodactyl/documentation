# Environment Configuration

[[toc]]
## Overview
Pterodactyls environment settings are configured and stored in the `.env` file located in your installations root directory ex. /var/www/pterodactyl. Some of the settings are also chached in the database and thoose will by default override the setting in `.env`. To change this behaviour you can edit `.env` and change the setting `APP_ENVIRONMENT_ONLY=false` to `APP_ENVIRONMENT_ONLY=true`.
This change takes imediate effect and should be reflected on a reload of the Panel in your browser.
Once you have resolved whatever issues you might be having you should change it back to `APP_ENVIRONMENT_ONLY=false` so that the Panel can manage it's settings in the database.

### Manually editing the database
If you need to manually edit a setting, you can do so by changing the value in the `settings` table in the Pterodactyl
database. Some values are encrypted however, so you cannot just edit those, you'll either need to provide a new
encrypted value or follow the instructions above for reading from the environment until you fix it manually in the Panel.

## Configuration examples

### APP_REPORT_ALL_EXCEPTIONS - Report All Exceptions
By default Pterodactyl only logs and reports exceptions that are, well, exceptional by nature. There are some exceptions
that we expect to occur such as authentication failures or validation issues. However, in rare instances when developing,
or even on production servers, you might need to have all exceptions logged to detect inconsistent behavior.

To do this, simply set `APP_REPORT_ALL_EXCEPTIONS=true` in your `.env` file. You'll want to turn this off once you've
completed whatever it is you're needing the exceptions for, otherwise your logs will become very large, very quickly.

### CLIENT_DATABASES_ENABLED - Client Databases
By default Pterodactyl ships with the ability for clients to have their own per-server databases. If you wish to disable
this ability, set `PTERODACTYL_CLIENT_DATABASES_ENABLED` to be `false`. Pterodactyl also attempts to create databases
on a database host assigned to the current server's node but will use any host if one can't be found. If you would like
to force a database to be created only on a host belonging to that server's node, set `PTERODACTYL_CLIENT_DATABASES_ALLOW_RANDOM`
to be `false`.

```
PTERODACTYL_CLIENT_DATABASES_ENABLED=true
PTERODACTYL_CLIENT_DATABASES_ALLOW_RANDOM=true
```

### TRUSTED_PROXIES - Reverse Proxy Setup
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

### Cloudflare Specific Configuration
If you're using Cloudflare's Flexible SSL you should set `TRUSTED_PROXIES` to contain [their IP addresses](https://www.cloudflare.com/ips/).
Below is an example of how to set this.

```
TRUSTED_PROXIES=103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,104.16.0.0/12,108.162.192.0/18,131.0.72.0/22,141.101.64.0/18,162.158.0.0/15,172.64.0.0/13,173.245.48.0/20,188.114.96.0/20,190.93.240.0/20,197.234.240.0/22,198.41.128.0/17
```

### FILES_MAX_EDIT_SIZE - Increasing Editable File Size
By default the Panel attempts to set a reasonable limit for editing files through the web based file manager. However,
some users find it too restrictive and wish to increase the size. This is controlled by a configuration value that can
also be set using the `.env` file. The default value is `50,000` bytes but this can be increased as you see fit.

```
PTERODACTYL_FILES_MAX_EDIT_SIZE=50000
```

### RECAPTCHA_ENABLED - Configuring ReCaptcha
If you have ReCaptcha enabled in Panel and you get locked out because there is some issue with the configuration, setting `RECAPTCHA_ENABLED=false` in the `.env` file will disable the ReCaptcha mechanism.

#### Custom configuration
Pterodactyl comes preconfigured to use ReCaptcha but you should configure it to use keys specific for your site.
1. Goto [Googles ReCaptcha admin console](https://www.google.com/recaptcha/admin#list), you need to login with a  Google Account.
2. Under "Register new site" fill in a name for your keys, this can be anything but choose something so you remeber what they are used for.
3. Choose ReCaptcha v2 and check the option "Invisible"
4. Fill in the list of domains for which the keys should be valid. It's important that this is the correct domain where your Panel can be reached. So if you installed Pterodactyl to panel.example.com that is what should go in the list, as well as any aliases that point to the same site, maybe pterodactyl.example.com depending on how you configured your domains and webserver.
4.1 If you don't care for the extra security of validating that the ReCaptcha verifications comes from your site, then after you have done step 6 you can locate "Advanced Settings" in the displayed page and uncheck the box "Verify the origin of reCaptcha solution" and Save the changes. This can be useful if there is some problem with the domain verification.
5. Check the box "Accept the reCAPTCHA Terms of Service.", after having actually read and accepted the indicated legal texts.
6. Press the "Register" button
7. On the new page displayed locate two textboxes labeled "Site key" and "Secret key" respectively. You now have the option to,
7.1 Enter the keys into the `env` file as `RECAPTCHA_WEBSITE_KEY=<the text in the box Site key>` and `RECAPTCHA_SECRET_KEY=<the text in the box Site key>`
7.2 or goto "Admin Control Panel" in your Panel, it' the gears up in the right corner, click on "Settings" and the "Advanced" tab. Enter the keys in the boxes "Site key" and "Secret key" respectively.
