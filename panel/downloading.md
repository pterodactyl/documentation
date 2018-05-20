# Download

Before downloading the Pterodactyl Panel, we need to create a directory to store
it in.

```
mkdir -p /var/www/pterodactyl
cd /var/www/pterodactyl
```

Now that the directory has been created and we are inside of it, download the Panel files.

```
curl -Lo panel.tar.gz https://github.com/pterodactyl/panel/releases/download/v0.7.6/panel.tar.gz
```

::: tip Verify File Integrity
It would be a good idea to verify the integrity of the panel archive.  Run `sha256sum panel.tar.gz` and verify that it matches `a904dc978e00bbec026d3c53d7bedefbc77ad722ddcdbfbb9cf4a51dc28e685a`
:::

After we have the archive downloaded, we will need to unzip it.

```
tar --strip-components=1 -xzvf panel.tar.gz
```

Finally, lets set the proper file permissions so the panel can write important files.

```
chmod -R 755 storage/* bootstrap/cache
```
