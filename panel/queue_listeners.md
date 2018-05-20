# Queue Listeners
We make use of Queues to make the application faster and handle sending emails and other actions in the background. You will need to setup the queue worker for these actions to be processed.

## Crontab
We need to setup one cronjob to run every minute so that your server tasks will be queued. Simply run `sudo crontab -e` and then enter the code below at the bottom.

```
* * * * * php /var/www/pterodactyl/artisan schedule:run >> /dev/null 2>&1
```

Also make sure that `cron` is running by running `sudo service cron start`.

## Queue Worker

::: warning Ubuntu 14.04 Notice
If you are using `Ubuntu 14.04` you **cannot** use this method to run your queue worker. Please see [these instructions](https://laravel.com/docs/5.6/queues#supervisor-configuration) for installing Supervisor and setting up your queue. Ensure you use the same `ExecStart` line as below.
:::

We then need to add a queue worker `systemd` script. To do so, create a file in `/etc/systemd/system` named `pteroq.service`, and paste the contents of the block below in it.

```
# Pterodactyl Queue Worker File
# ----------------------------------
# File should be placed in:
# /etc/systemd/system
#
# nano /etc/systemd/system/pteroq.service

[Unit]
Description=Pterodactyl Queue Worker
After=redis-server.service

[Service]
# On some systems the user and group might be different.
# Some systems use `apache` as the user and group.
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/pterodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3

[Install]
WantedBy=multi-user.target
```

You will then need to start the queue worker, as well as have it start automatically on service boot.

```
sudo systemctl enable pteroq.service
sudo systemctl start pteroq
```
