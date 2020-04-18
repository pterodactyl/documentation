# Kernel Modifications

[[toc]]

::: tip
In most cases, only users with a server provided by OVH will need to make any modifications to their kernel.
:::

## Update Kernel
Install the new kernels using apt-get. In this case we are installing the latest version of the kernel,
but feel free to browse using apt-cache search linux-image-extra to find all possible image versions you can
install. You'll want to install the latest.

``` bash
apt-get install linux-image-generic linux-image-extra-virtual
```

After you've installed the new kernel you'll need to update the grub loader using the command below. After that, a
server reboot is in order.

``` bash
sudo mv /etc/grub.d/06_OVHkernel /etc/grub.d/96_OVHkernel
sudo update-grub
sudo reboot
```

## Confirm Kernel
Once you've rebooted, check that the latest kernel is installed using `uname -r`, it should output `4.4.0-131-generic`
(in this case) or similar.

::: warning
If it still includes `-xxxx-grs-ipv6-64` or similar, it didn't work and you should move on top the steps below.
:::

## Set Default Boot
Ok, so unfortunately the easiest way didn't work, but don't worry, we can still fix this. Firstly, lets run a quick
command to list potential kernels, just look at the output and make sure you see your newly installed kernel listed.

``` bash
grep "menuentry '" /boot/grub/grub.cfg
```

After running that you should see output similar to the example below.

``` text
menuentry 'Ubuntu' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-simple-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-131-generic' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-131-generic-advanced-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-131-generic (recovery mode)' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-131-generic-recovery-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-127-generic' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-127-generic-advanced-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-127-generic (recovery mode)' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-127-generic-recovery-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-116-generic' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-116-generic-advanced-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
    menuentry 'Ubuntu, with Linux 4.4.0-116-generic (recovery mode)' --class ubuntu --class gnu-linux --class gnu --class os $menuentry_id_option 'gnulinux-4.4.0-116-generic-recovery-ad1a8550-963c-4a9f-b922-85827cf44fbe' {
```

As you can see, we have `Ubuntu, with Linux 4.4.0-131-generic` listed as the first indented option. To boot using this
specific kernel, we will need to modify our grub file.

``` bash
sudo nano /etc/default/grub
```

Find `GRUB_DEFAULT`, it is most likely set to `GRUB_DEFAULT=0`. We're going to modify it a bit to boot our new kernel.

``` text
GRUB_DEFAULT='Advanced options for Ubuntu>Ubuntu, with Linux 4.4.0-131-generic'
```

The only part of the code above that you might need to change is the `4.4.0-131-generic`, which you can find based on
the kernel version you install. You might also notice that it matches the first indented entry from the grep menuentry
command and also the version of the kernel that we installed above. Once you've done that, run the commands below to
update grub and reboot, and you should be set.

``` bash
sudo update-grub
sudo reboot
```

## Boot from hard disk
It's possible that even after you modified the GRUB configuration the server's still booted into a OVH kernel. If this happens to you, go to the OVH control panel and check the server's booting settings and make sure it's booting from hard disk instead of network boot.
