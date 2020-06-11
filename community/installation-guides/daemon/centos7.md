# CentOS 7
In this guide we will install Pterodactyl's Daemon v0.6.X — including all of it's dependencies — and configure it to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for CentOS 7.
:::

## Install Requirements
We will first begin by installing all of the Daemon's [required](/daemon/installing.md#dependencies) dependencies.

### General Requirements
```bash
yum install -y tar unzip make gcc gcc-c++ python
```

### Docker

```bash
yum install -y yum-utils device-mapper-persistent-data lvm2

yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

yum install -y docker-ce

systemctl enable docker
systemctl start docker
```

### Nodejs

```bash
curl --silent --location https://rpm.nodesource.com/setup_10.x | bash -
yum install -y nodejs
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
