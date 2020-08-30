# Publishing a Release

::: tip
This documentation is specific to the core project team and serves to document how we create, deploy, and announce
releases of this software. It might be an interesting read, but you'll likely never use anything out of this on a
day-to-day basis.
:::

[[toc]]

## Pick a Codename
If this is going to be a major version release `0.X` or `1.X` (not `0.0.X`), you will need to have a codename picked
out for the release. This should be some type of rhyme or otherwise creative name, ideally using some type of Pterodactyl
related species name.

## Create the Release Branch
Releases should be created as their own branch on GitHub, following the GitFlow model. This means you'll need to create
a `release/vX.X.X` branch. Once the branch is created you need to update the version number for the software. For the Panel
this requires editing `config/app.php` and setting the specific `APP_VERSION` _without_ a preceding `v`. For the Daemon,
you need to edit `package.json` and set the `version` field, again _without_ a preceding `v`.

Once you've created the branch and update the relevant file publish the branch to GitHub to begin the next steps.

## Tag a Release
Once the branch is pushed up you need to tag a release and then configure it on GitHub. To do so, run the command below
setting the version correctly. This will create a tag for `v0.6.0` on the `release/v0.6.0` branch and sign it using your
GPG key.

::: warning Sign Your Releases
All releases must be made with a GPG signed tag. Do not create a tag without signing it.
:::

``` bash
git tag -asm "v0.6.0"
git push origin v0.6.0
```

### Update the Release on GitHub
Once you've created and pushed up the tag you need to then go to the GitHub releases, find the most recent tag, and create
a nice release from it. The title should be `v1.2.3 (Codename)`, and the content should be from the Changelog for that release.
All minor version releases should use the same codename as the major release version.

## Generate Signatures & Hashes
Once you've created the release on GitHub, view it and select the option to download the `.tar.gz` archive of the release.
Once downloaded, rename it to `panel.tar.gz` or `daemon.tar.gz`.

``` bash
mv panel-v1.2.3.tar.gz panel.tar.gz
```

### Create Checksum
Then, create the SHA 256 checksum and write it to a file which will be uploaded to the release on GitHub.

``` bash
shasum -a 256 panel.tar.gz > checksum.txt

# Dump the output for easy pasting into the release
cat checksum.txt
```

### GPG Sign Release
Finally, create a GPG-signed file to verify the integrity of the release. This must be created using Pterodactyl's key,
so chances are that only Dane will be doing this part.

``` bash
gpg --detach-sig --output panel.asc panel.tar.gz
```

### Attach to Release
Finally, upload `panel.tar.gz`, `checksum.txt`, and `panel.asc` to the release as attachments. This will allow all of our
defined links to continue working. In addition, add a section to the release titled `#### SHA256 Checksum` with the content
of the checksum for people to verify with.

## Update Documentation
After the release is created and ready to go, update the relevant documentation to ensure it will be the version people
install or upgrade to. You should also make sure all of the documentation for installing or upgrading is squared away and
ready to go.

## Update CDN
Dane will need to update the CDN `releases.json` file to point to the most recent version of the Panel and Daemon so that
notifications show up on the Daemon and Panel encouraging people to update.

## Make Discord Announcement
The last step is to make an announcement on Discord letting `@everyone` know that a new release is available, and encouraging
them to update. Include relevant links to stem off the inevitable flood of "how 2 update" questions that will follow.

## Example Process
The entire process, command wise, will probably look something like below:

``` bash
git checkout -b release/v1.2.3

# make file edits
git push -u origin release/v1.2.3

git tag -as v1.2.3 -m "v1.2.3"
git push origin v1.2.3

# edit release on GitHub, download files

mv panel-1.2.3.tar.gz panel.tar.gz
shasum -a 256 panel.tar.gz > checksum.txt
cat checksum.txt

gpg --detach-sig --output panel.asc panel.tar.gz

# attach to release
```
