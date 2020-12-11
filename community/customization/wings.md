# Customizing Wings
:::warning Production
We highly recommend **NOT** performing these actions on production
:::

In order to make changes to wings we recommend forking it to keep your own git version making upgrades easier. <br />
:::tip Editing Files
We do not provide a guide at the current time on what files to edit to get certain results. This guide expects a basic knowledge of the `go` language
:::

## Building Wings
:::tip Build output
GO builds to be run on the build system therefore you **HAVE TO** run the build command on a linux system
:::

### Build Requirements
GoLang compiler/runtime [https://golang.org/doc/install](https://golang.org/doc/install)

### Building
Run the following command in your code directory
```bash
go build
```
You should now have a `wings` binary file in your wings directory.
## Install the new binary

:::tip User Access
In order to use the guide bellow you need sudo permission level you can atchive this by placing `sudo` in front of each command or running `sudo su -` in order to become root
:::

1. Backup the current installation of wings

```bash
# Stop Wings
systemctl stop wings
# Backup Wings
mv /usr/local/bin/wings /usr/local/bin/wingsOld
```
2. Place the new binary in `/usr/local/bin`
3. Ensure aproperiate permissions on the binary `chmod u+x /usr/local/bin/wings`
4. Try running the updated binary from the console `wings --debug`
5. Restore normal operation of Wings `systemctl enable wings --now`
