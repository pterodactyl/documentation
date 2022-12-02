# Environment Variables

[[toc]]

## Application Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `APP_NAME` | "Pterodactyl" | Any | The name of your panel, this is shown in the header of pages in the panel. |
| `APP_ENV` | "production" | Any | The environment your panel is currently running in. |
| `APP_DEBUG` | false | true, false | When in debug mode, more detailed information including stack traces will be logged from the panel. |
| `APP_URL` | "http://localhost" | Any | The URL your panel is running on, this is used for generating URLs for other services. |
| `APP_TIMEZONE` | "UTC" | [Supported Timezones](https://www.php.net/manual/en/timezones.php) | The timezone for the panel, used for date-time functions and services. |
| `APP_LOCALE` | "en" | Any | The locale for the panel used for translations. Note that the panel **does not** have a translations system yet, so it is recommended to keep the value as "en". |
| `APP_KEY` | | Any | The encryption key for the panel, see [Getting Started](/panel/1.0/getting_started.md#installation). |
| `APP_REPORT_ALL_EXCEPTIONS` | false | true, false | Logs all exceptions reported by the panel. |

## Backups Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `APP_BACKUP_DRIVER` | "wings" | "wings", "s3" | The driver to use for managing server backups. |
| `BACKUP_PRESIGNED_URL_LIFESPAN` | 60 | Any Number | The time in minutes for the lifespan of presigned URLs used for uploading backups to S3 storage. |
| `BACKUP_MAX_PART_SIZE` | 5368709120 | Any Number | The maximum size in bytes of a single upload part for S3 storage. |
| `BACKUP_PRUNE_AGE` | 360 | Any Number | The time in minutes to wait before automatically failing an incomplete backup. Set to `0` to disable. |
| `BACKUP_THROTTLE_LIMIT` | 2 | Any Number | The number of backups that can be created within the backup throttle period, this includes deleted backups. Set to `0` to disable. |
| `BACKUP_THROTTLE_PERIOD` | 600 | Any Number | The time period in seconds to allow backups to be created in. |
| `AWS_DEFAULT_REGION` | | Any | The region of the S3 storage. |
| `AWS_ACCESS_KEY_ID` | | Any | |
| `AWS_SECRET_ACCESS_KEY` | | Any | |
| `AWS_BACKUPS_BUCKET` | | Any | |
| `AWS_ENDPOINT` | | Any | |
| `AWS_USE_PATH_STYLE_ENDPOINT` | false | true, false | |
| `AWS_BACKUPS_USE_ACCELERATE` | false | true, false | |
| `AWS_BACKUPS_STORAGE_CLASS` | | Any | |

## Broadcasting Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `BROADCAST_DRIVER` | "null" | "ably", "log", "null", "pusher", "redis" | The broadcaster to use for events. |
| `PUSHER_APP_KEY` | | Any | The connection key for the Pusher driver. |
| `PUSHER_APP_SECRET` | | Any | |
| `PUSHER_APP_ID` | | Any | |
| `PUSHER_HOST` | "api-mt1.pusher.com" | URL | |
| `PUSHER_CLUSTER` | "mt1" | Cluster ID | The ID of the pusher cluster. |
| `PUSHER_PORT` | 443 | Any Port | The port to listen on. |
| `PUSHER_SCHEME` | "https" | "http", "https" | The HTTP scheme to use. |
| `ABLY_KEY` | | Any | The key for the Ably driver. |

## CORS Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `APP_CORS_ALLOWED_ORIGINS` | "" | Any URI | The allowed origins for CORS, separated by commas. |

## Filesystem Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `FILESYSTEM_DISK` | "local" | "local", "ftp", "sftp", "s3" | The default filesystem disk to use. |
| `AWS_ACCESS_KEY_ID` | | Any | The access key ID for the AWS driver. |
| `AWS_SECRET_ACCESS_KEY` | | Any | The secret key for the AWS driver. |
| `AWS_DEFAULT_REGION` | | Any | The default region of the AWS driver. |
| `AWS_BUCKET` | | Any | The name of the AWS bucket. |
| `AWS_URL` | | URL | The URL to the AWS bucket. |
| `AWS_ENDPOINT` | | URI | The endpoint to the AWS bucket. |
| `AWS_USE_PATH_STYLE_ENDPOINT` | false | true, false | Whether to use the path style endpoint. |

## Hashids Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `HASHIDS_SALT` | | Any | The salt to use for hashing. |
| `HASHIDS_LENGTH` 8 | Number | The length of the hash. |
| `HASHIDS_ALPHABET` | abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 | Any | The character range to use for hashing. |

## Hasing Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `BCRYPT_ROUNDS` | 10 | Number | The number of rounds to perform when hashing. |

## HTTP Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `APP_API_CLIENT_RATELIMIT` | 720 | Number | The number of requests to allow per minute for the client API. |
| `APP_API_APPLICATION_RATELIMIT` | 240 | Number | The number of requests to allow per minute for the application API. |

## reCAPTCHA Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `RECAPTCHA_ENABLED` | true | true, false | Whether reCAPTCHA should be enabled. |
| `RECAPTCHA_DOMAIN` | "https://www.google.com/recaptcha/api/siteverify" | URL | The API endpoint to use for reCAPTCHA checks. |
| `RECAPTCHA_SECRET_KEY` | "6LcJcjwUAAAAALOcDJqAEYKTDhwELCkzUkNDQ0J5" | Any | The secret key to use for the reCAPTCHA API. |
| `RECAPTCHA_WEBSITE_KEY` | "6LcJcjwUAAAAAO_Xqjrtj9wWufUpYRnK6BW8lnfn" | Any | The site key to use for the reCAPTCHA API. |

## Trusted Proxy Variables

| Name | Default Value | Allowed Values | Description |
|------|---------------|----------------|-------------|
| `TRUSTED_PROXIES` | | Any | The proxy IP addresses to allow, separated by commas. |
