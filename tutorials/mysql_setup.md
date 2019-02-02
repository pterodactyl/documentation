# Setting up MySQL
[[toc]]

MySQL is a core component of Pterodactyl Panel but it can be confusing to setup and use if you've never done so before.
This is a very basic tutorial that skims just enough of the surface to set MySQL up and running with the panel.
If you're interested in learning more, there are some great tutorials available on the Internet.

## Logging In
The first step in this process is to login to the MySQL command line where we will be executing some statements to get
things setup. To do so, simply run the command below and provide the Root MySQL account's password that you setup when
installing MySQL. If you do not remember doing this, chances are you can just hit enter as no password is set.

``` bash
mysql -u root -p
```

## Creating a User
For security sake, and due to changes in MySQL 5.7, you'll need to create a new user for the panel. To do so, we want
to first tell MySQL to use the mysql database, which stores such information.

Next, we will create a user called `pterodactyl` and allow logins from localhost which prevents any external connections
to our database. You can also use `%` as a wildcard or enter a numeric IP. We will also set the account password
to `somePassword`.

``` sql
USE mysql;

# Remember to change 'somePassword' below to be a unique password specific to this account.
CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'somePassword';
```

## Create a Database
Next, we need to create a database for the panel. In this tutorial we will be naming the database `panel`, but you can
substitute that for whatever name you wish.

``` sql
CREATE DATABASE panel;
```

## Assigning Permissions
Finally, we need to tell MySQL that our pterodactyl user should have access to the panel database. To do this, simply
run the command below. If you plan on also using this MySQL instance as a database host on the Panel you'll want to
include the `WITH GRANT OPTION` (which we are doing here). If you won't be using this user as part of the host setup
you can remove that.

``` sql
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```
