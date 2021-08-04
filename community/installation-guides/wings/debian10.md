# Debian 10
In this guide we will install Pterodactyl's Wings v1.X — including all of it's dependencies — and configure it to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/wings/1.0/installing.md) but is tailored specifically for Debian 10.
:::

## Install Requirements
We will first begin by installing all of Wings' [required](/wings/1.0/installing.md#dependencies) dependencies.

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

## Enable docker service
systemctl enable docker
systemctl start docker
```

## Installing Wings
Great, now all of the dependencies have been dealt with. From here follow the [official Wings installation documentation](/wings/1.0/installing.html#enabling-swap).
