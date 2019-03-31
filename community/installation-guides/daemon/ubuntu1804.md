# Ubuntu 18.04
In this guide we will install Pterodactyl's Daemon (wings) — including all of it's dependencies — and configure it
to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for Ubuntu 18.04.
:::

## Install Requirements
We will first begin by installing all of the Daemon's [required](/daemon/installing.md#dependencies) dependencies.

### General Requirements
```bash
apt install -y zip unzip tar make gcc g++ python
```

### Docker

```bash
curl -sSL https://get.docker.com/ | CHANNEL=stable bash

systemctl enable docker
systemctl start docker
```

### Nodejs

```bash
apt install -y nodejs npm
```

## Installing the Daemon
Great, now all of the dependencies and firewall rules have been dealt with. From here follow the [official Daemon installation documentation](/daemon/installing.md#installing-daemon-software).
