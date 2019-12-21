# Archlinux
In this guide we will install Pterodactyl's Daemon (wings) — including all of it's dependencies — and configure it
to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for Archlinux.
:::

## Install Requirements
We will first begin by installing [yay](https://github.com/Jguer/yay) to handle the installation of the Daemon ([from the Archlinux User Repos](https://aur.archlinux.org/packages/pterodactyl-daemon/) and it's dependencies.

### General Requirements
```bash
sudo pacman -S git base-devel
```

### Yay

```bash
git clone https://aur.archlinux.org/yay-git.git
cd yay-git
makepkg -scif
```

## Installing the Daemon
```
yay -S pterodactyl-daemon
```

### Docker
(Docker was installed as a dependency when the Daemon was installed)
```
systemctl enable docker
systemctl start docker
```

## Configure Daemon
Once you have installed the daemon and required components, the next step is to create a node on your installed Panel.
Once you have done that there will be a tab called Configuration when you view the node.

Simply copy and paste the code block and paste it into a file called  and save it.
A script has been provided by the installed Daemon package at `/usr/bin/pterodactyl-daemon-config` which opens `/srv/daemon/config/core.json` with nano as root to allow editing.
You may also use the Auto-Deployment feature rather than manually creating the files.

![](./../../../.vuepress/public/daemon_configuration_example.png)

## Starting the Daemon

A script for starting the daemon is provided by the pterodactyl-daemon package at /usr/bin/pterodactyl-daemon.


To start your daemon simply run the command below which will start the daemon in
foreground mode. Once you are done, use `CTRL+C` to terminate the process. Depending on your server's internet connection
pulling and starting the Daemon for the first time may take a few minutes.

``` bash
pterodactyl-daemon
```

### Daemonizing (using systemd)

Running Pterodactyl Daemon in the background is a simple task, just make sure that it runs without errors before doing
this. A file called `wings.service` has been included in `/etc/systemd/system` directory when the Daemon package was installed.

Run the command below to reload systemd and start the daemon.

``` bash
systemctl enable --now wings
```


### Issues & Support

The [pterodactyl-daemon](https://aur.archlinux.org/packages/pterodactyl-daemon/) AUR package for Archlinux is maintained by community members, please submit any packaging issues to the comments section of the [AUR page](https://aur.archlinux.org/packages/pterodactyl-daemon/).
