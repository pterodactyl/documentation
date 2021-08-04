# Ubuntu 20.04
In this guide we will install Pterodactyl's Wings v1.X — including all of it's dependencies — and configure it to use a SSL connection.

[[toc]]

::: tip
This guide is based off the [official installation documentation](/wings/1.0/installing.md) but is tailored specifically for Ubuntu 20.04.
:::

## Install Requirements
We will first begin by installing all of Wings' [required](/wings/1.0/installing.md#dependencies) dependencies.

### Docker

```bash
## Install docker
apt install -y docker.io

## Enable docker service
systemctl enable docker
systemctl start docker
```

## Installing Wings
Great, now all of the dependencies and firewall rules have been dealt with. From here follow the [official Wings installation documentation](/wings/1.0/installing.html#enabling-swap).
