# Disabling reCAPTCHA

:::warning SECURITY WARNING
It is highly recommended to keep reCAPTCHA enabled, as reCAPTCHA is a security method that can protect your site from some methods of attack!
Only continue if you intend to re-enable reCAPTCHA after fixing whatever issue you may have!
:::

## Disabling via .env

To disable reCAPTCHA using this method, you need to find and edit your `.env` file, It is usually located at `/var/www/pterodactyl/.env`

:::tip Hidden Files
In linux, files starting with a `.` are considered to be hidden, so most FTP software may not show it by default. You can see the file by using `ls -a`
:::

First, lets back up the `.env` file. If you are not already, now is a good time to make sure you are in the `/var/www/pterodactyl` directory

```bash
cp .env .env.bkp
```

You can now edit the `.env` file using your favorite editor to set the fields below

:::tip Missing Values
If any of the bellow values are missing from your `.env` file you can add them yourself
:::

```bash
# Ignores database settings
APP_ENVIRONMENT_ONLY=true

# Disable reCAPTCHA. You may need to add this to the end of your file.
RECAPTCHA_ENABLED=false
```

### Restoring Functionality

After fixing your issue, it is **Highly** recommended to re-enable reCAPTCHA in order to protect your panel. This is achived by restoring the previous settings in the `.env` as follows

```bash
# Allows updating panel configuration via the panel (optional)
APP_ENVIRONMENT_ONLY=false

# Ensures reCAPTCHA is enabled
RECAPTCHA_ENABLED=true
```

## Editing your database

:::danger DANGEROUS: Not Recommended
While faster, this method should only be used if the `.env` method fails or you know what you are doing! We do not take responsibility if you manage to corrupt your database using this method!
:::

```sql
mysql -u root -p
USE panel;
UPDATE settings SET value = 'false' WHERE 'key' = 'settings::recaptcha:enabled';
```

If the command returns with `Query OK, 0 rows affected (0.000 sec)` you need to use the `.env` method to disable reCAPTCHA

Again, it is **Highly** recommended to re-enable reCAPTCHA after you fix your issue, whether through the `.env` above or in the panel!
