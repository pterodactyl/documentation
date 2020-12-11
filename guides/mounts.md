# Using Mounts

A mount in pterodactyl follows similar principles to a docker mount. Pterodactyl already uses the `/home/container` mount thus it or any of it's sub directories can not be used as a different or nested mount.

## Wings Configuration

In order to use a mount you need to permit wings to use the selected mount path, this is done by editing mounts in `/etc/pterodactyl/config.yml` 

```yml
allowed_mounts:
- /example
```

where `example` is a path on your system, Mounts allow anything within that path to be used as a mount.

## Panel Configuration

In the pterodactyl panel you need to create and assign a mount.

### Creating a mount

:::tip Mount Paths
Mounts can not use any path or subpath of `/home/container` due to docker limitations
:::

1. In the admin panel go to **Mounts**
2. Use the create mount option
3. Fill in the details as required
   - **Name**: Name for your mount
   - **Description**:Description for your mount
   - **Source**:File path on your system to where mount files should be stored
   - **Target**: File path where the mount will be placed inside of your server, Can NOT be `/home/container`
   - **Read Only**: Whether to allow servers to write to the directory
   - **User Mountable**: Whether to allow users to self mount this mount
4. After creating the mount you are required to add **Eggs** and **Nodes** that this mount may be used on
:::danger Mount Logic
Mounts do not share data across servers, They only can share paths not files!
::: 

### Assigning a mount

1. In the admin panel go to the server you would like to use a mount with
2. Go to the mounts page
3. Click the ➕ button
4. Restart the server

The files of the mount should become available in the target path in the container.

:::warning Disclaimer
Mounts do not show in the panel's file manager, nor will they be accessible via sFTP
:::
