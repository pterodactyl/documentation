# Using Mounts

Mounts can be used to make directories on a node available to servers running on it.

## Wings Configuration

For security reasons it is not possible to mount directories on a node by default. Directories that should be mountable have to be specified explicitly in the Wings configuration.

In the Wings configuration file (`/etc/pterodactyl/config.yml`) the `allowed_mounts` field is used to list mountable directories. The listed directories and all their subdirectories can be mounted.

```yml
allowed_mounts:
- /example
```

## Panel Configuration

You have to configure mounts in admin Panel in order to use them with your servers. They consist of a source pad on the node and a target path where it will be mounted in the container.

:::warning Path in the container
Mounts can not contain `/home/container` or any subdirectory of it nor can you cross-mount servers such as Server A directory into Server B.
:::

### Creating a Mount

1. In the admin Panel go to **Mounts**.
2. Create a new mount.
3. Fill in the details as required.
   - **Name**: Name for your mount.
   - **Description**: Description for your mount.
   - **Source**: The absolute path to the folder or files on the Node machine.
   - **Target**: The absolute path where the mount will be placed inside of your server, can **not** include `/home/container` in the path.
   - **Read Only**: Whether the mount will be read-only for the servers using it.
   - **User Mountable**: Whether to allow users to self mount this mount.
4. After creating the mount you are required to add **Eggs** and **Nodes** that this mount may be used on.

:::warning Mounts used by multiple servers
All servers using the same mounts will **only** share its contents when they are on the same node. Mounts are not synchronized between servers.
:::

### Assigning a Mount to a Server

1. In the admin Panel navigate to the server you would like to use a mount with
2. Go to the mounts page
3. Click the **+** button
4. Restart the server

The files of the mount should become available in the target path in the container.

:::warning Mounts cannot be accessed
Mounts do not appear in the Panel's file manager, nor are they accessible via SFTP. The server itself will be able to see and use the mounts.
:::

### Example Mount

The example mount below is stored in the path `/var/lib/pterodactyl/mounts` which we add to the Wings config.yml

```yml
allowed_mounts:
  - /var/lib/pterodactyl/mounts
```

![](./../.vuepress/public/gmod_mount_example.png)
