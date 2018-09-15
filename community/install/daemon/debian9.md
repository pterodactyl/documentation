# Install wings on Debian 9

This guide covers the installation of the requirements for a daemon with SSL enabled.

[[toc]]

## Install Requirements

The daemon requirements can be found [here](/daemon/installing.md#system-requirements)

### General Requirements
```bash
apt install -y zip unzip tar make gcc g++ python curl gnupg
```

### Docker

```bash
## install apt tools
apt install apt-transport-https ca-certificates curl gnupg2 software-properties-common

## Import the docker gpg key
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -

## Add the docker stable repo
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

## Install docker
apt update
apt install docker-ce

systemctl enable docker
systemctl start docker
```

### nodejs

```bash
## Install nodejs repo
curl -sL https://deb.nodesource.com/setup_8.x | bash -

## Install nodejs
apt install -y nodejs
```

## Installing the daemon
Follow the regular guide to install the [daemon](/daemon/installing.md#installing-daemon-software)