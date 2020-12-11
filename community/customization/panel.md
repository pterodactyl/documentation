# Panel
The official [BUILDING.md](https://github.com/pterodactyl/panel/blob/develop/BUILDING.md)
# Rebuild panel assets 
## Install Dependencies
The following commands will install the necessary dependencies for building your panel.
### Install NodeJS
::: tip
You may have to add sudo to the following commands if you are not root.
:::
```bash
# Ubuntu/Debian
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
apt install -y nodejs

# CentOS
curl -sL https://rpm.nodesource.com/setup_12.x | sudo -E bash -
yum install -y nodejs # CentOS 7
dnf install -y nodejs # CentOS 8
```
By now, you should have NodeJS 12 installed. Make sure this is the case by checking `node -v`
### Install Yarn and Panel Dependencies
```bash
npm i -g yarn # Installs yarn
# Now you need to make sure you are in the panel directory
cd /var/www/pterodactyl
yarn install # Installs panel build dependencies
```
## Build Panel
Run this in your panel directory to apply changes (usually `/var/www/pterodactyl`)
```bash
yarn build:production # Build panel
```
