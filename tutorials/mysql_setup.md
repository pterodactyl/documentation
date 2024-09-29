# Setting up MySQL
[[toc]]


## Creating a database for Pterodactyl
MySQL is a core component of Pterodactyl Panel but it can be confusing to setup and use if you've never done so before.
This is a very basic tutorial that skims just enough of the surface to set MySQL up and running with the panel.
If you're interested in learning more, there are some great tutorials available on the Internet.

### Logging In
The first step in this process is to login to the MySQL command line where we will be executing some statements to get
things setup. To do so, simply run the command below and provide the Root MySQL account's password that you setup when
installing MySQL. If you do not remember doing this, chances are you can just hit enter as no password is set.

```sql
# If using MariaDB (v11.0.0+)
mariadb -u root -p

# If using MySQL
mysql -u root -p
```

### Creating a user
For security sake, and due to changes in MySQL 5.7, you'll need to create a new user for the panel. To do so, we want
to first tell MySQL to use the mysql database, which stores such information.

Next, we will create a user called `pterodactyl` and allow logins from localhost which prevents any external connections
to our database. You can also use `%` as a wildcard or enter a numeric IP. We will also set the account password
to `somePassword`.

``` sql
# Remember to change 'somePassword' below to be a unique password specific to this account.
CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'somePassword';
```

### Create a database
Next, we need to create a database for the panel. In this tutorial we will be naming the database `panel`, but you can
substitute that for whatever name you wish.

``` sql
CREATE DATABASE panel;
```

### Assigning permissions
Finally, we need to tell MySQL that our pterodactyl user should have access to the panel database. To do this, simply
run the command below.

``` sql
GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1';
```

## Creating a Database Host for Nodes
:::tip
This section covers creating a MySQL user that has permission to create and modify users. This allows the Panel to create per-server databases on the given host.
:::

### Creating a user
If your database is on a different host than the one where your Panel or Daemon is installed make sure to use the IP address of the machine the Panel is running on. If you use `127.0.0.1` and try to connect externally, you will receive a connection refused error.

```sql
# You should change the username and password below to something unique.
CREATE USER 'pterodactyluser'@'127.0.0.1' IDENTIFIED BY 'somepassword';
```

### Assigning permissions
The command below will give your newly created user the ability to create additional users, as well as create and destroy databases. As above, ensure `127.0.0.1` matches the IP address you used in the previous command.

```sql
GRANT ALL PRIVILEGES ON *.* TO 'pterodactyluser'@'127.0.0.1' WITH GRANT OPTION;
```

### Allowing external database access
Chances are you'll need to allow external access to this MySQL instance in order to allow servers to connect to it. To do this, open `my.cnf`, which varies in location depending on your OS and how MySQL was installed. You can type `find /etc -iname my.cnf` to locate it.

Open `my.cnf`, add text below to the bottom of the file and save it:
```
[mysqld]
bind-address=0.0.0.0
```
Restart MySQL/MariaDB to apply these changes. This will override the default MySQL configuration, which by default will only accept requests from localhost. Updating this will allow connections on all interfaces, and thus, external connections. Make sure to allow the MySQL port (default 3306) in your firewall.

If your Database and Wings are on the same machine and won't need external access, you can also use the `docker0` interface IP address rather than `127.0.0.1`. This IP address can be found by running `ip addr | grep docker0`, and it likely looks like `172.x.x.x`.
