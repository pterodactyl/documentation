# Debian 10
In this guide we will install Pterodactyl's Daemon 0.6.X — including all of it's dependencies — and configure it
to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/daemon/installing.md) but is tailored specifically for Debian 10.
:::

## Install Requirements
We will first begin by installing all of the Daemon's [required](/daemon/installing.md#dependencies) dependencies.

### General Requirements
```bash
apt install -y zip unzip tar make gcc g++ python python-dev curl gnupg
```

### Docker

```bash
## install apt tools
apt install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common

## Import the docker gpg key
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -

## Add the docker stable repo
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

## Install docker
apt update -y
apt install -y docker-ce

systemctl enable docker
systemctl start docker
```

### Nodejs

```bash
## Install nodejs repo
curl -sL https://deb.nodesource.com/setup_10.x | bash -

## Install nodejs
apt install -y nodejs
```

## Installing the Daemon
Great, now all of the dependencies have been dealt with. From here follow the [official Daemon installation documentation](/daemon/installing.md#installing-daemon-software).
