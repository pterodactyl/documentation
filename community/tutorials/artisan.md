# Artisan CLI

The Artisan CLI, command line interface, is part of the Laravel framework, which Pterodactyl is built on. The Artisan file is located in `/var/www/pterodactyl` if you followed the official guide. This guide goes over some more Pterodactyl specific/related Artisan commands, which are all prefixed with the letter `p` (e.g. `p:user:make`). If you'd like to view all commands, you can do so by running:

```bash
php artisan list
```

To get information regarding a specific command you can do so by running:

```bash
php artisan help <command>
```

::: tip
To simplify this documentation, in command usage you'll see things like the following:

`<hello-world>` - Required argument

`[hello-world]` - Optional argument

`{--hello-world}` - Option

:::

## User Management

When running any of the following commands, you can either use the options or don't pass through anything and use the interactive prompt. You can also do both passing through options and using interactive prompts as well.

### Create User

```bash
php artisan p:user:make {--email=user@example.com}
                        {--username=myusername}
                        {--name-first=My}
                        {--name-last=Name}
                        {--password=supersecret}
                        {--admin=1|0}
                        {--no-password}
```

### Delete User

```bash
php artisan p:user:delete {--user=username/email/UUID}
```

### Disable 2FA

::: warning
Disabling 2-factor authentication should only be used as a last resort for user recovery. **Please use this with caution.**
:::

```bash
php artisan p:user:disable2fa {--email=user@example.com}
```

## Server & Node Management

### Create Location

```bash
php artisan p:location:make {--short=us1}
                            {--long="A description of this location."}
```

### Delete Location

```bash
php artisan p:location:delete {--short=us1}
```

### Server Bulk Power

```bash
php artisan p:server:bulk-power <start, stop, kill, restart>
                                {--servers=1,2,3}
                                {--nodes=1,2,3}
```

## Panel Management

### View Panel Info

```bash
php artisan p:info
```

Displays a variety of panel information that can be used to check the configuration of things such as database and email.

### Update Panel

```bash
php artisan p:upgrade   {--user=www-data}
                        {--group=www-data}
                        {--url=https://example.com/panel.tar.gz}
                        {--release=latest}
                        {--skip-download}
```

Downloads a new archive for Pterodactyl and executes the normal upgrade commands.
