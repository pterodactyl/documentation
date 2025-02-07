# Building Wings

:::warning
Do **not** run the following steps on your production nodes.
:::

Wings is written in Go. This makes it very easy to modify and compile it on your own, and distribute your own binaries.
This guide will cover the steps necessary to build it yourself.

It will not, however, explain where to look for certain aspects of Wings and which changes are necessary to achieve specific results. Knowledge of the Go language is required if you want to modify it.

Building Go programs is very easy, and the same also applies to Wings. Go is cross-platform, but Wings only supports Linux at the moment. The easiest way to compile it for Linux is to run the commands on a Linux machine.

## Build Requirements

An up to date version of Go is required to compile Wings. The minimum version can be found at the top of the [go.mod](https://github.com/pterodactyl/wings/blob/develop/go.mod) file. See the [official instructions](https://golang.org/doc/install) for help with installing Go.

## Building

Execute the following command in your local clone of the repository to compile Wings into a binary.

```bash
go build
```

You should now have a `wings` binary file in your wings directory.

## Install the new binary

:::tip Root required
Some the following commands require root permissions. Prepend them with `sudo` if you are not logged in as root.
:::

1. Backup the current installation of wings

```bash
mv /usr/local/bin/wings /usr/local/bin/wings-backup
```

2. Place the new binary in `/usr/local/bin`

```
cp ./wings /usr/local/bin
```

3. Restart wings 

```
systemctl restart wings
```

## Troubleshooting

If the wings service does not start properly, you can try to start Wings in a console window.

```
wings --debug
```

Remember to stop the system service before, and re-enable it afterwards.

```
systemctl stop wings

systemctl start wings
```
