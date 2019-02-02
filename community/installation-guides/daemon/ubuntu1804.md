# Install wings on Ubuntu 18.04

This guide covers the installation of the requirements for a daemon with SSL enabled.

[[toc]]

## Install Requirements

The daemon requirements can be found [here](/daemon/installing.md#system-requirements)

### General Requirements
```bash
apt install -y zip unzip tar make gcc g++ python
```

### Docker

```bash
apt install -y docker.io

systemctl enable docker
systemctl start docker
```

### nodejs

```bash
apt install -y nodejs npm
```

## Installing the daemon
Follow the regular guide to install the [daemon](/daemon/installing.md#installing-daemon-software)