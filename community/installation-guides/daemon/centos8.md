# CentOS 8
In this guide we will install Pterodactyl's Daemon (wings) — including all of it's dependencies — and configure it to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for CentOS 8.
:::

## Install Requirements
We will first begin by installing all of the Daemon's [required](/daemon/installing.md#dependencies) dependencies.

### General Requirements
```bash
dnf install -y tar unzip make gcc gcc-c++ python2

alternatives --set python /usr/bin/python2
```

### Docker

```bash
dnf install -y dnf-utils device-mapper-persistent-data lvm2

dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo

dnf install -y docker-ce --nobest

systemctl enable docker
systemctl start docker
```

### Nodejs

```bash
dnf install -y nodejs
```

### Server Ports
```bash
firewall-cmd --add-port 8080/tcp --permanent
firewall-cmd --add-port 2022/tcp --permanent
firewall-cmd --permanent --zone=trusted --change-interface=docker0
firewall-cmd --reload
```

## Installing the Daemon
Great, now all of the dependencies and firewall rules have been dealt with. From here follow the [official Daemon installation documentation](/daemon/installing.md#installing-daemon-software).
