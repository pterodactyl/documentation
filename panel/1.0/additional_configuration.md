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

#### Multipart Upload

The S3 backup is using the S3 multipart upload capabilities. In rare situations, you might want to adjust the size of a single part or the lifespan of the generated pre-signed URLs. The default part size is 5GB, and the default pre-signed URL lifespan is 60 minutes.

You can configure the maximal part size using the `BACKUP_MAX_PART_SIZE` environment variable. You must specify the size in bytes. To define the pre-signed URL lifespan, use the `BACKUP_PRESIGNED_URL_LIFESPAN` variable. The expected unit is minutes.

The following `.env` snippet configures 1GB parts and uses 120 minutes as the pre-signed URL lifespan:

```bash
BACKUP_MAX_PART_SIZE=1073741824
BACKUP_PRESIGNED_URL_LIFESPAN=120
```

#### Storage Class

Should you need to specify a storage class, use the `AWS_BACKUPS_STORAGE_CLASS` environment variable. Default option is `STANDARD` (S3 Standard).

The following `.env` snippet sets the class to `STANDARD_IA` (this is an example).

```bash
# STANDARD_IA is an example.
AWS_BACKUPS_STORAGE_CLASS=STANDARD_IA
```

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
# If using MariaDB (v11.0.0+)
mariadb -u root -p

# If using MySQL
mysql -u root -p
```
```sql
UPDATE panel.settings SET value = 'false' WHERE `key` = 'settings::recaptcha:enabled';
```

## 2FA

If possible you should use the panel to update your 2FA settings. If you can't access your panel for what ever reason you can use the following steps.

### Disable 2FA requirement

```sql
# If using MariaDB (v11.0.0+)
mariadb -u root -p

# If using MySQL
mysql -u root -p
```
```sql
UPDATE panel.settings SET value = 0 WHERE `key` = 'settings::pterodactyl:auth:2fa_required';
```

### Disable 2FA for a specific user

Run the following command in your `/var/www/pterodactyl` directory.

``` bash
php artisan p:user:disable2fa
```

## Telemetry

Since 1.11, the Panel collects anonymous metrics about the Panel and all connected nodes.
This feature is enabled by default, but can be disabled.

The data collected by this feature is not sold or used for advertising purposes.  Aggregate statistics
may be made public or shared with third-parties for the purposes of improving the software.

### How does it work?

The Telemetry system works by first generating a random UUIDv4 identifier for the Panel installation.
This identifier is stored in the database so people load-balancing multiple Panel instances can still
have a unique identifier.  This identifier is then sent to a remote server, along the associated
telemetry data.  The telemetry data is collected every 24 hours, there is no ongoing collection
or local storage of the telemetry data, we collect the data right before we send it to the remote
server.

Currently, all telemetry collection logic is handled by the [TelemetryCollectionService](https://github.com/pterodactyl/panel/blob/1.0-develop/app/Services/Telemetry/TelemetryCollectionService.php#L53)
on the panel.  This service is responsible for collecting all the data that is sent to the remote
server.

### What data is collected?

If you wish to see the full data that is collected, please look at the TelemetryCollectionService
(as linked above), or use the `php artisan p:telemetry` command to view the exact data that will
be sent to the remote server.

As of 2022-12-12, the data collected consists of:

* Unique identifier for the Panel
* Version of the Panel
* PHP version
* Backup storage driver (S3, Local, etc.)
* Cache driver (Redis, Memcached, etc.)
* Database driver and version (MySQL, MariaDB, PostgreSQL, etc.)
* Resources
  * Allocations
    * Total number
    * Total number of used allocations (assigned to a server)
  * Backups
    * Total number
    * Sum of the total amount of bytes stored by backups
  * Eggs
    * Total number
    * ~~Map of egg UUIDs to the number of servers using that egg~~ (removed in 1.11.2)
  * Locations
    * Total number
  * Mounts
    * Total number
  * Nests
    * Total number
    * ~~Map of nest UUIDs to the number of servers using eggs in that nest~~ (removed in 1.11.2)
  * Nodes
    * Total number
  * Servers
    * Total number
    * Number of servers that are suspended
  * Users
    * Total number
    * Number of users that are admins
* Nodes
  * Node UUID
  * Version of Wings on the node
  * Docker
    * Version
    * Cgroups
      * Driver
      * Version
    * Containers
      * Total
      * Running
      * Paused
      * Stopped
    * Storage
      * Driver
      * Filesystem
    * runc
      * Version
  * System
    * Architecture (`amd64`, `arm64`, etc.)
    * CPU Threads
    * Memory Bytes
    * Kernel Version
    * Operating System (Debian, Fedora, RHEL, Ubuntu, etc.)
    * Operating System Type (bsd, linux, windows, etc.)

### How is the data stored?

Currently, the data is stored with Cloudflare, we ingest all telemetry data with a Worker which does
basic processing such as validation and then inserts it into Cloudflare D1.  Right now, there is not
an API or visualization for any of the data collected, and it can only be manually queried.  Only
Matthew is able to query the data at this time, but we are working on alternatives to make this data
more accessible.

### Why?

The primary reason for collecting this data is to help us make better decisions about the future of
this software.  With the release of 1.11, the minimum PHP version requirement jumped from 7.4 to 8.0,
however, we wanted to add a feature that required PHP 8.1 which would've made the version requirement
jump larger and potentially cause issues for some users.  By collecting this data, we can hopefully
have more insight to how changes like this will affect the community and make better decisions in the
future.  This is especially important for information like the architecture, kernel version, and
operating system nodes are using.  For example, we want to utilize a feature that is only present in
some filesystems, but we have no idea how many people are using those filesystems, so we cannot
determine if it's worth the effort to implement.

Some of the data is not as useful for making decisions, but is still useful for us to know.
For example, have you ever wondered how many Panel instances there are?  How many servers are being
ran across all of those instances?  How many users are using the Panel?  How many of those users are
admins?  How many servers are using a specific egg?  How many servers are using a specific nest?
All of these questions can be answered by the data we collect, and can help us and the community
better understand how the software is being used.

If you have any questions about the data we collect, please feel free to reach out to us on Discord.
Our goal is to be as transparent as possible, and we want to make sure that the community understands
what we are doing and why.

### Enabling Telemetry

Telemetry is enabled by default, if you want to enable it after disabling it, edit your `.env` file
and either remove the `PTERODACTYL_TELEMETRY_ENABLED` line, or set it to `true`.

```text
PTERODACTYL_TELEMETRY_ENABLED=true
```

You may also use the `php artisan p:environment:setup` command to enable telemetry, optionally with
the `--telemetry` flag for a non-interactive setup.

### Disabling Telemetry

To disable telemetry, edit your `.env` file and set `PTERODACTYL_TELEMETRY_ENABLED` to `false`.

```text
PTERODACTYL_TELEMETRY_ENABLED=false
```

You may also use the `php artisan p:environment:setup` command to disable telemetry, optionally with
the `--telemetry=false` flag for a non-interactive setup.
