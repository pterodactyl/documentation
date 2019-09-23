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
To simplify this documentaiton, in command usage you'll see things like the following:

`<hello-world>` - Required argument

`[hello-wolrd]` - Optional argument

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
Disabling 2-factor authentication should only be used as a last restort for user recovery. **Please use this with caution.**
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

### Server Rebuild

```bash
php artisan p:server:rebuild [server-id] {--node=1}
```

This will initiate a rebuild on all servers, all servers on a node, or a specific server depending on the information given.

## Panel Management

### View Panel Info

```bash
php artisan p:info
```

Displays a variety of panel information which can be used to check the configuation of this like database and email.

## Theme Management

This is a commonly missed section of commands, but they exist and more people should be aware of them. Pterodactyl has a built in theming system and with that comes a variety of commands for managing them easier.

### List All Themes

```bash
php artisan theme:list
```

This is will show a table of all currently installed themes along with their views and asset paths. This does not show themes that are ready to be installed, only installed themes.

### Install a Theme

```bash
php artisan theme:install [theme-name]
```

This will search for the file with the theme name followed by a `.theme.tar.gz` (standard Igaster theme packaged). If no theme name is provided, it will load all themes and give you a selection to install from.

### Create a Theme

```bash
php artisan theme:create [theme-name]
```

### Remove a Theme

```bash
php artisan theme:remove [theme-name]
```
