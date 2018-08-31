# Shared Folder

Since all server are run on docker and the files and folders in the server they can't be used from other servers inside the docker.
But using this trick you can add your custom folder to be available to any server

## Edit the docker
You have to edit the following folder with your favourite editor

``` bash
/srv/daemon/src/controllers/dockers.js
```

Find this part where there are all dockers mounts
``` bash
                    HostConfig: {
                        Mounts: [
                            {
                                Target: '/home/container',
                                Source: this.server.path(),
                                Type: 'bind',
                                ReadOnly: false,
                            },
                            {
                                Target: Config.get('docker.timezone_path'),
                                Source: Config.get('docker.timezone_path'),
                                Type: 'bind',
                                ReadOnly: true,
                            },
                        ],
```
We are now adding a new mount to it, example i would share the minecraft schematic folder will be available to all servers.
We will add the section under "Mounts"
``` bash
                            {
                                Target: '/schematics',
                                Source: '/home/83ac2e3c-6408-4e77-8a1d-e66ea0b3f006/plugins/WorldEdit/schematics',
                                Type: 'bind',
                                ReadOnly: false,
                            },
```
The "Target" will be the short alias that will permit the acccess of the "Source", so the other servers will use the andress "/schematics" for connect to "/home/83ac2e3c-6408-4e77-8a1d-e66ea0b3f006/plugins/WorldEdit/schematics" and access to all files.
So after we added it, that part should look like this

``` bash
                    HostConfig: {
                        Mounts: [
                            {
                                Target: '/home/container',
                                Source: this.server.path(),
                                Type: 'bind',
                                ReadOnly: false,
                            },
                            {
                                Target: Config.get('docker.timezone_path'),
                                Source: Config.get('docker.timezone_path'),
                                Type: 'bind',
                                ReadOnly: true,
                            },
                            {
                                Target: '/schematics',
                                Source: '/home/83ac2e3c-6408-4e77-8a1d-e66ea0b3f006/plugins/WorldEdit/schematics',
                                Type: 'bind',
                                ReadOnly: false,
                            },
                        ],
```
We are going now to restart wings and rebuild the container for all server
``` bash
service wings restart
```
## Rebuild Containers
Because of some changes we made behind the scenes when it comes to displaying server output you'll need to rebuild and
restart all of your servers. The rebuild step is required, the restart step is optional, but highly recommended otherwise
you will not be able to see any console output.

Run the following commands _from the Panel server_ in order to perform a mass rebuild and restart. Replace `###` with the
ID of the node you just upgraded, or remove the `--node` flag entirely to rebuild on all nodes.

``` bash
php artisan p:server:rebuild --node=###
```

Then, restart all of the servers using the following command, or by manually restarting them one at a time in the Panel.

``` bash
php artisan p:server:bulk-power restart --nodes=###
