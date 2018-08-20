# Docker on Debian 8

[[toc]]

::: warning
There is a potential for broken software after this upgrade as we are moving to a non-stable kernel (in regards
to mainline Debian). Please take backups and only proceed if you are comfortable with this process.
:::

## Install Docker
To begin with, we're going to install docker just like we would for any other OS by following Docker's
[official documentation for Debian](https://docs.docker.com/install/linux/docker-ce/debian/#install-docker-ce).

Once you've done that, if you run `docker info` you'll notice some missing features at the bottom, something
like the output below.

``` text
WARNING: No memory limit support
WARNING: No swap limit support
WARNING: No kernel memory limit support
WARNING: No oom kill disable support
WARNING: No cpu cfs quota support
WARNING: No cpu cfs period support
```

## Update GRUB Startup
To fix the memory limit support issues, we just need to add two arguments to our default grub startup. Start by
opening `/etc/default/grub` and adding the following arguments to `GRUB_CMDLINE_LINUX_DEFAULT`.

``` text
swapaccount=1 cgroup_enable=memory
```

The line should then look like the one below — assuming nothing else was in the quote to begin with.

``` text
GRUB_CMDLINE_LINUX_DEFAULT="swapaccount=1 cgroup_enable=memory"
```

After doing that, run `sudo update-grub` to update our grub configuration.

## Add Backports Repo
We then need to enable the `jessie-backports` apt repository to install a newer kernel. To do this, run the commands below.

``` bash
echo deb http://http.debian.net/debian jessie-backports main > /etc/apt/sources.list.d/jessie-backports.list
echo deb http://http.debian.net/debian jessie-backports main contrib non-free > /etc/apt/sources.list.d/jessie-backports.list
sudo apt update
```

To find the most recent kernels, run `apt-cache search linux-image` which will list all of the ones available. In this
case, we'll install the `4.9.0` kernel using the command below. Once we've done that, it is time to reboot the server
to start using this kernel.

``` bash
apt install -t jessie-backports linux-image-4.9.0-0.bpo.3-amd64
reboot
```

## Update Software & Setup Docker
Now that we're on the new kernel you probably need to update some software to take advantage of it. To do this,
simply run the command below.

``` bash
apt update && apt upgrade
```

Once that is done, we need to make an adjustment to docker to use `overlay2` rather than `aufs` since `aufs` is not
supported on this kernel currently. Run the command below to do so.

``` bash
sed -i 's,/usr/bin/dockerd,/usr/bin/dockerd --storage-driver=overlay2,g' /lib/systemd/system/docker.service
```

Finally, update `systemd` and start docker using the following commands.

``` bash
systemctl daemon-reload
service docker start
```

Docker should now be running and reporting no errors if you run `docker info`!
