# Install wings on CentOS 7

This guide covers the installation of the requirements for a daemon with SSL enabled.

[[toc]]

## Install Requirements

The daemon requirements can be found [here](/daemon/installing.md#system-requirements)

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

### nodejs

```bash
curl --silent --location https://rpm.nodesource.com/setup_8.x | bash -
yum install -y nodejs
```

### server ports

```bash
firewall-cmd --add-port 8080/tcp --permanent
firewall-cmd --add-port 2022/tcp --permanent
firewall-cmd --permanent --zone=trusted --change-interface=docker0
firewall-cmd --reload
```

## Installing the daemon
Follow the regular guide to install the [daemon](/daemon/installing.md#installing-daemon-software)