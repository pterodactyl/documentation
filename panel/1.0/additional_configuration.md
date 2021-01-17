# Additional Configuration

[[toc]]

## Backups

Pterodactyl Panel allows users to create backups of their servers. In order to create backups, backup storage has to be configured.

### Using S3 Backups

AWS S3 (or compatible storage) can be used to store backups. The following configuration options have to be set in the `.env` file in order to enable it.

```bash
# Sets your panel to use s3 for backups
APP_BACKUP_DRIVER=s3

# Info to actually use s3
AWS_DEFAULT_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_BACKUPS_BUCKET=
AWS_ENDPOINT=
AWS_BACKUPS_USE_ACCELERATE=false

# This was/is planned to be depreciated by AWS thus if set to true it will fail the request.
AWS_USE_PATH_STYLE_ENDPOINT=false
```

## reCAPTCHA

The Panel uses invisible reCAPTCHA to secure the login page from brute-force attacks. If the login attempt is considered suspicious, users may be required to perform a reCAPTCHA challenge.

### Configuring reCAPTCHA

While we provide a global Site Key and Secret Key by default, we highly recommend changing it for your own setup.

You can generate your own keys in the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).

The keys can then be applied using the Settings in the admin panel. The reCAPTCHA settings can be found on the **Advanced** 

### Disabling reCAPTCHA

:::warning SECURITY WARNING
We do not recommend disabling reCAPTCHA. It is a security mechanism that makes it harder to perform brute-force attacks on user accounts.
:::

If users have trouble logging in, or your Panel isn't exposed to the internet, in can make sense to disable reCAPTCHA.

reCAPTCHA can easily be disabled using the admin panel. In the Settings, select the **Advanced** tab and set the **Status** of reCAPTCHA to **disabled**.

#### Using the .env file

If you cannot access the panel yourself, you can also disable reCAPTCHA using the `.env` file.

```
RECAPTCHA_ENABLED=false
```

#### Editing your database

:::danger DANGEROUS: Not Recommended
Proceed carefully. By running queries on your database directly, you can easily break your setup.
:::
If you cannot access your panel, but have used the web panel based settings already, you can modify the database directly using the following commands.


```sql
mysql -u root -p
USE panel;
UPDATE settings SET value = 'false' WHERE 'key' = 'settings::recaptcha:enabled';
```

If the command returns with `Query OK, 0 rows affected (0.000 sec)` you need to use the `.env` method to disable reCAPTCHA
