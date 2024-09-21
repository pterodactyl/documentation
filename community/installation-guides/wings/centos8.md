# Enterprise Linux 8 and Fedora Server 40
This guide provides comprehensive instructions for installing Pterodactyl Wings v1.X on CentOS 8, Rocky Linux 8, AlmaLinux 8 and Fedora Server 40.

[[toc]]

## Install Dependencies

```bash
# Install required packages
sudo dnf install -y dnf-utils device-mapper-persistent-data lvm2

# Add Docker repository (Enterprise Linux 8)
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
# Add Docker repository (Fedora Server 40)
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

## Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io

## Enable Docker service
systemctl enable --now docker

# Configure firewall
firewall-cmd --add-port 8080/tcp --permanent
firewall-cmd --add-port 2022/tcp --permanent
firewall-cmd --permanent --zone=trusted --change-interface=pterodactyl0
firewall-cmd --zone=trusted --add-masquerade --permanent
firewall-cmd --reload
```

## Installing Wings
Great, now all of the dependencies and firewall rules have been dealt with. From here follow the [official Wings installation documentation](/wings/1.0/installing.html#enabling-swap).

::: tip
If you have SELinux enforcement enabled and you are getting AVC denials from your containers, try relocating your Wings data directory from `/var/lib/pterodactyl` to `/var/srv/containers/pterodactyl`. That is where the targeted policy expects Docker to read and write data from.
:::
