# Building Panel Assets

:::warning
Do **not** run the following steps on your production nodes.
:::

Instructions on how to build the panel are also available in the [BUILDING.md](https://github.com/pterodactyl/panel/blob/develop/BUILDING.md) file.

The frontend of the Panel is built with React. Any changes to the source files require to recompile it.
This also applies to style sheets. The following sections explain how to do so.

## Install Dependencies

The following commands will install the necessary dependencies for building the Panel assets.

The build tools require NodeJS, yarn is used as the package manager.

```bash
# Ubuntu/Debian
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt install -y nodejs

# CentOS
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs yarn # CentOS 7
sudo dnf install -y nodejs yarn # CentOS 8
```

Install required javascript packages.

```bash
npm i -g yarn # Install Yarn

cd /var/www/pterodactyl
yarn # Installs panel build dependencies
```

## Build Panel Assets

The following command will rebuild the Panel frontend. For NodeJS version 17 and above, you must enable the `--openssl-legacy-provider` option before building.

```bash
cd /var/www/pterodactyl
export NODE_OPTIONS=--openssl-legacy-provider # for NodeJS v17+
yarn build:production # Build panel
```

You can use command `yarn run watch` to view the progress of your changes in almost real-time for easier development. Once you're satisfied with your changes build the panel using the previously mentioned `yarn build:production` command. 
