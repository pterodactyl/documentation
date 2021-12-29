# Additional Configuration

[[toc]]

## Backups

Pterodactyl Panel allows users to create backups of their servers. In order to create backups, a backup storage method has to be configured.

When changing Pterodactyl Panel's backup storage method, users may still download or delete existing backups from the prior storage driver. In the instance of migrating from S3 to local backups, S3 credentials must remain configured after switching to the local backup storage method.

### Using Local Backups

By default, Pterodactyl Panel uses local storage via Wings for backups. That said, this method of backup storage can be explicitly set with the following configuration in the `.env` file:

```bash
# Sets your panel to use local storage via Wings for backups
APP_BACKUP_DRIVER=wings
```

Do note that, when using local storage via Wings, the destination for backups is set in Wings' `config.yml` with the following setting key:

```yml
system:
  backup_directory: /path/to/backup/storage
```

### Using S3 Backups

AWS S3 (or compatible storage) can be used to store remote or cloud-based backups. The following configuration options have to be set in the `.env` file or as environment variables in order to enable it:

```bash
# Sets your panel to use s3 for backups
APP_BACKUP_DRIVER=s3

# Info to actually use s3
AWS_DEFAULT_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BACKUPS_BUCKET=
AWS_ENDPOINT=
```
For some configurations, you might have to change your S3 URL from `bucket.domain.com` to `domain.com/bucket`. To accomplish this, add `AWS_USE_PATH_STYLE_ENDPOINT=true` to your `.env` file.

## Reverse Proxy Setup

When running Pterodactyl behind a reverse proxy, such as [Cloudflare's Flexible SSL](https://support.cloudflare.com/hc/en-us/articles/200170416-What-do-the-SSL-options-mean-)
or Nginx/Apache/Caddy, etc., you will need to make a quick modification to the Panel to ensure things continue to work as expected. By default, when using these reverse proxies,
your Panel will not correctly handle requests. You'll most likely be unable to login or see security warnings in your browser console as it attempts to load insecure assets.
This is because the internal logic the Panel uses to determine how links should be generated thinks it is running over HTTP and not over HTTPS.

You will need to edit the `.env` file in the Panel's root directory to contain `TRUSTED_PROXIES=*` at minimum. We highly suggest providing a specific IP address
(or comma-separated list of IPs) rather than allowing `*`. For example, if your proxy is running on the same machine as the server,
the chances are that something like `TRUSTED_PROXIES=127.0.0.1` will work for you.

### NGINX Specific Configuration

For Pterodactyl to properly respond to an NGINX reverse proxy, the NGINX `location` config must contain the following lines:

```Nginx
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

```text
TRUSTED_PROXIES=173.245.48.0/20,103.21.244.0/22,103.22.200.0/22,103.31.4.0/22,141.101.64.0/18,108.162.192.0/18,190.93.240.0/20,188.114.96.0/20,197.234.240.0/22,198.41.128.0/17,162.158.0.0/15,104.16.0.0/13,104.24.0.0/14,172.64.0.0/13,131.0.72.0/22
```

## reCAPTCHA

The Panel uses invisible reCAPTCHA to secure the login page from brute-force attacks. If the login attempt is considered suspicious, users may be required to perform a reCAPTCHA challenge.

### Configuring reCAPTCHA

While we provide a global Site Key and Secret Key by default, we highly recommend changing it for your own setup.

You can generate your own keys in the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).

The keys can then be applied using the Settings in the admin panel. The reCAPTCHA settings can be found on the **Advanced** tab.

### Disabling reCAPTCHA

:::warning SECURITY WARNING
We do not recommend disabling reCAPTCHA. It is a security mechanism that makes it harder to perform brute-force attacks on user accounts.
:::

If users have trouble logging in, or your Panel isn't exposed to the internet, it can make sense to disable reCAPTCHA.

reCAPTCHA can easily be disabled using the admin panel. In the Settings, select the **Advanced** tab and set the **Status** of reCAPTCHA to **disabled**.

#### Editing your database

If you cannot access your panel, you can modify the database directly using the following commands.


```sql
mysql -u root -p
UPDATE panel.settings SET value = 'false' WHERE `key` = 'settings::recaptcha:enabled';
```

## 2FA

If possible you should use the panel to update your 2FA settings. If you can't access your panel for what ever reason you can use the following steps.

### Disable 2FA requirement

```sql
mysql -u root -p
UPDATE panel.settings SET value = 0 WHERE `key` = 'settings::pterodactyl:auth:2fa_required';
```

### Disable 2FA for a specific user

Run the following command in your `/var/www/pterodactyl` directory.

``` bash
php artisan p:user:disable2fa
```
