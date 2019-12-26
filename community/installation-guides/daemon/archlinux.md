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
sudo systemctl enable docker
sudo systemctl start docker
```

## Configure Daemon

From here follow the [official Daemon installation documentation](/daemon/installing.md#configure-daemon).

### Issues & Support

The [pterodactyl-daemon](https://aur.archlinux.org/packages/pterodactyl-daemon/) and panel AUR packages are maintained by community members, please submit any packaging issues to the comments section of the [AUR page](https://aur.archlinux.org/packages/pterodactyl-daemon/) and not to the Pterodactyl github.
