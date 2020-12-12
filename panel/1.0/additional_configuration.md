# Additional Configuration

[[toc]]

## Backup Configuration

### Using S3 Backups

<!--Might need to expand a bit more on here-->
To use S3 backups you may use the following `.env` variables
```bash
# Sets your panel to use s3 for backups
APP_BACKUP_DRIVER=s3

# Info to actually use s3
AWS_DEFAULT_REGION=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

AWS_BACKUPS_BUCKET=

AWS_ENDPOINT=

# Dunno what these are but maybe you do?
AWS_USE_PATH_STYLE_ENDPOINT=false
AWS_BACKUPS_USE_ACCELERATE=false
```
