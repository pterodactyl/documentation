# Installing Wings

Wings is the next generation server control plane from Pterodactyl. It has been rebuilt from the
ground up using Go and lessons learned from our first Nodejs Daemon.

::: warning
You should only install Wings if you are running **Pterodactyl 1.x**. Do not install this software
for previous versions of Pterodactyl.
:::

## Supported Systems

The following is a list of supported operating systems. Please be aware that this is not an exhaustive list,
there is a high probability that you can run the software on other Linux distributions without much effort.
You are responsible for determining which packages may be necessary on those systems. There is also a very
high probability that new releases of the supported OSes below will work just fine, you are not restricted to
only the versions listed below.

| Operating System                   | Version |     Supported      | Notes                                                       |
| ---------------------------------- | ------- | :----------------: | ----------------------------------------------------------- |
| **Ubuntu**                         | 20.04   | :white_check_mark: | Documentation written assuming Ubuntu 20.04 as the base OS. |
|                                    | 22.04   | :white_check_mark: |                                                             |
|                                    | 24.04   | :white_check_mark: |                                                             |
| **RHEL / Rocky Linux / AlmaLinux** | 8       | :white_check_mark: |                                                             |
|                                    | 9       | :white_check_mark: |                                                             |
| **Debian**                         | 11      | :white_check_mark: |                                                             |
|                                    | 12      | :white_check_mark: |                                                             |
| **Windows**                        | All     |        :x:         | This software will not run in Windows environments.         |

## System Requirements

To run Wings, you will need a Linux system capable of running Docker containers. Most VPS and almost all
dedicated servers should be capable of running Docker, but there are edge cases.

When your provider uses `Virtuozzo`, `OpenVZ` (or `OVZ`), or `LXC` virtualization, you will most likely be unable to
run Wings. Some providers have made the necessary changes for nested virtualization to support Docker. Ask your provider's support team to make sure. KVM is guaranteed to work.

The easiest way to check is to type `systemd-detect-virt`.
If the result doesn't contain `OpenVZ` or`LXC`, it should be fine. The result of `none` will appear when running dedicated hardware without any virtualization.

Should that not work for some reason, or you're still unsure, you can also run the command below.

```bash
dane@pterodactyl:~$ sudo dmidecode -s system-manufacturer
VMware, Inc.
```

## Dependencies

- curl
- Docker

### Installing Docker

For a quick install of Docker CE, you can execute the command below:

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash
```

If you would rather do a manual installation, please reference the [official Docker documentation](https://docs.docker.com/engine/install/) for how to install Docker CE on your server.

::: warning Check your Kernel
Please be aware that some hosts install a modified kernel that does not support important docker features. Please
check your kernel by running `uname -r`. If your kernel ends in `-xxxx-grs-ipv6-64` or `-xxxx-mod-std-ipv6-64` you're
probably using a non-supported kernel. Check our [Kernel Modifications](../../../daemon/0.6/kernel_modifications.md) guide for details.
:::

#### Start Docker on Boot

If you are on an operating system with systemd (Ubuntu 16+, Debian 8+, CentOS 7+) run the command below to have Docker start when you boot your machine.

```bash
sudo systemctl enable --now docker
```

#### Enabling Swap
::: tip Recent Linux kernel
Since the version 6.1 of the Linux kernel, swap is enabled by default. If you are running a kernel version 6.1 or newer, you can skip this step. To check your kernel version, run `uname -r`.
:::

On most systems, Docker will be unable to setup swap space by default. You can confirm this by running `docker info` and looking for the output of `WARNING: No swap limit support` near the bottom.

Enabling swap is entirely optional, but we recommended doing it if you will be hosting for others and to prevent OOM errors.

To enable swap, open `/etc/default/grub` as a root user and find the line starting with `GRUB_CMDLINE_LINUX_DEFAULT`. Make
sure the line includes `swapaccount=1` somewhere inside the double-quotes.

After that, run `sudo update-grub` followed by `sudo reboot` to restart the server and have swap enabled.
Below is an example of what the line should look like, _do not copy this line verbatim. It often has additional OS-specific parameters._

```text
GRUB_CMDLINE_LINUX_DEFAULT="swapaccount=1"
```

::: tip GRUB Configuration
Some Linux distros may ignore `GRUB_CMDLINE_LINUX_DEFAULT`. Therefore you might have to use `GRUB_CMDLINE_LINUX` instead should the default one not work for you.
:::

## Installing Wings

The first step for installing Wings is to ensure we have the required directory structure setup. To do so,
run the commands below, which will create the base directory and download the wings executable.

```bash
sudo mkdir -p /etc/pterodactyl
curl -L -o /usr/local/bin/wings "https://github.com/pterodactyl/wings/releases/latest/download/wings_linux_$([[ "$(uname -m)" == "x86_64" ]] && echo "amd64" || echo "arm64")"
sudo chmod u+x /usr/local/bin/wings
```

::: warning OVH/SYS Servers
If you are using a server provided by OVH or SoYouStart please be aware that your main drive space is probably allocated to
`/home`, and not `/` by default. Please consider using `/home/daemon-data` for server data. This can be easily
set when creating the node.
:::

## Configure

Once you have installed Wings and the required components, the next step is to create a node on your installed Panel. Go to your Panel administrative view, select Nodes from the sidebar, and on the right side click Create New button.

After you have created a node, click on it and there will be a tab called Configuration. Copy the code block content, paste it into a new file called `config.yml` in `/etc/pterodactyl` and save it.

Alternatively, you can click on the Generate Token button, copy the bash command and paste it into your terminal.

![example image of wings configuration](./../../.vuepress/public/wings_configuration_example.png)

::: warning
When your Panel is using SSL, the Wings must also have one created for its FQDN. See [Creating SSL Certificates](/tutorials/creating_ssl_certificates.html) documentation page for how to create these certificates before continuing.
:::

### Starting Wings

To start Wings, simply run the command below, which will start it in a debug mode. Once you confirmed that it is running without errors, use `CTRL+C` to terminate the process and daemonize it by following the instructions below. Depending on your server's internet connection pulling and starting Wings for the first time may take a few minutes.

```bash
sudo wings --debug
```

You may optionally add the `--debug` flag to run Wings in debug mode.

### Daemonizing (using systemd)

Running Wings in the background is a simple task, just make sure that it runs without errors before doing
this. Place the contents below in a file called `wings.service` in the `/etc/systemd/system` directory.

```text
[Unit]
Description=Pterodactyl Wings Daemon
After=docker.service
Requires=docker.service
PartOf=docker.service

[Service]
User=root
WorkingDirectory=/etc/pterodactyl
LimitNOFILE=4096
PIDFile=/var/run/wings/daemon.pid
ExecStart=/usr/local/bin/wings
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Then, run the commands below to reload systemd and start Wings.

```bash
sudo systemctl enable --now wings
```

### Node Allocatio

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

Starting with MySQL 8.0.13 / MariaDB 10.11 or above, `bind_address` now also accepts a comma-separated list of interfaces to give more control over what interfaces it will listen on and which not.



![example image of node allocations](../../.vuepress/public/node_allocations.png)

Type `hostname -I | awk '{print $1}'` to find the IP to be used for the allocation. Alternatively, you can type `ip addr | grep "inet "` to see all your available interfaces and IP addresses. Do not use 127.0.0.1 for allocations.
