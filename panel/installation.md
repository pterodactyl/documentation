# Installation
This section covers how to install the panel once all of the dependencies have been met and the panel 
files have been downloaded.

## Composer
Pterodactyl Panel makes use of [Composer](https://getcomposer.org/) to install dependencies and get everything setup
and running for you. In order to use composer, you wil first need to install it.

```
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
```

## Database Configuration
Pterodactyl Panel will automatically configure your database for you. You will need to have connection details on hand, 
as well as create __an empty database__ for the panel to install to.

## Setup
Once you have composer installed you only need to run one command to have 
the panel run through the installation and setup process.

```
cp .env.example .env
composer install --no-dev
```

When you run the command above it will begin by installing all of the dependencies required by the panel into 
the `vendor/` directory.

We then need to generate an application encryption key using the command below. 
_You should only run this command once when installing the Panel._

```
php artisan key:generate --force
```

::: danger Stop!
The key you generated with the above command should never be disclosed to others, and you should store a secure copy of 
that key off-site in a secure manner. If you ever need to reinstall the Panel or migrate to a new server you will need 
to continue using this key to avoid losing encrypted information in the database.
:::

## Environment Configuration
::: tip MySQL Database
__You will need an existing MySQL database__ and non-root user to continue with the installation. 
Please see our [Setting Up MySQL](https://pterodactyl.io/docs/setting-up-mysql) tutorial for how to do this 
if you are unsure.
:::

The next thing we need to do is get our environment setup for the panel. 
To do this, run the commands below and follow the prompts.

```
php artisan p:environment:setup
php artisan p:environment:database
```

After you've configured the environment, we need to configure email handling. To do that, enter the command below and 
follow the prompts. If you would like to use PHP's mail() function simply select the mail option. You also have the 
option to use SMTP or an email delivery service.

```
php artisan p:environment:mail
```

## Database Setup
We can now setup the database. This is an automatic process that only requires you enter the command below.

```
php artisan migrate
```

::: tip
This command will ask if you are sure you want to continue on a live environment, tell it yes.
:::

Once the database is setup we then need to seed the database with nest information. To do so, run the command below.

```
php artisan db:seed
```

## Add Admin Account
Finally, we need to create an admin account on the system. Run the command below and follow the prompts to do so.

```
php artisan p:user:make
```

::: warning
Passwords for the user must include mixed case, at least one number, and at least 8 characters. 
The script will fail otherwise.
:::

## Set Permissions
The last step here is to set the proper owner of the files to be the user that runs your web server. 
In most cases this is `www-data` but can vary from system to system — sometimes being `nobody` or `apache`.

``` 
chown -R www-data:www-data *

# If using CentOS NGINX do:
chown -R nginx:nginx *

# If using CentOS Apache do:
chown -R apache:apache *
```
