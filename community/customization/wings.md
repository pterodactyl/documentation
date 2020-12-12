# Customizing Wings
:::warning Production
We highly recommend **NOT** performing these actions on the production
:::

We recommend creating a fork of the repo before making changes to wings to make future upgrades easier. <br />
:::tip Editing Files
We do not provide a guide at the current time on what files to edit to get certain results. This guide expects a basic knowledge of the `Go` language
:::

## Building Wings
:::tip
By default, Go targets the system it is executed on. Therefore, the easiest way of building binaries for Linux is to execute the following steps on a Linux system.
:::

### Build Requirements
You need to have an up-to-date version of the Go tools installed. See the [official instructions](https://golang.org/doc/install) for help with setting those up.

### Building
Execute the following command in your local clone of the repository to compile wings into a binary.
```bash
go build
```
You should now have a `wings` binary file in your wings directory.
## Install the new binary

:::tip Root required
To execute the next few commands, you will need root permissions. If you are not logged in as root, either use `sudo` in front of each command, or run `sudo -i` to switch to a root session.
:::

1. Backup the current installation of wings

```bash
# Stop Wings
systemctl stop wings
# Backup Wings
mv /usr/local/bin/wings /usr/local/bin/wings-backup
```
2. Place the new binary in `/usr/local/bin`
3. Ensure appropriate permissions on the binary `chmod u+x /usr/local/bin/wings`
4. Try running the updated binary from the console `wings --debug`
5. Restore normal operation of Wings `systemctl enable wings --now`
