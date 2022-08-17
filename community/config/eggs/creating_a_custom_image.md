# Creating a Custom Docker Image

[[toc]]

::: warning
This tutorial uses examples from our [`core:java`](https://github.com/pterodactyl/images/tree/java) docker image,
which can be found on GitHub. This tutorial also assumes some knowledge of [Docker](https://docker.io/), we suggest
reading up if this all looks foreign to you.
:::

## Creating the Dockerfile

The most important part of this process is to create the [`Dockerfile`](https://docs.docker.com/engine/reference/builder/)
that will be used by the Daemon. Due to heavy restrictions on server containers, you must setup this file in a specific manner.

We try to make use of [Alpine Linux](https://alpinelinux.org) as much as possible for our images in order to keep their size down.

```bash
# ----------------------------------
# Pterodactyl Core Dockerfile
# Environment: Java
# Minimum Panel Version: 0.6.0
# ----------------------------------
FROM openjdk:8-jdk-alpine

MAINTAINER Pterodactyl Software, <support@pterodactyl.io>

RUN apk add --no-cache --update curl ca-certificates openssl git tar bash sqlite fontconfig \
    && adduser --disabled-password --home /home/container container

USER container
ENV  USER=container HOME=/home/container

WORKDIR /home/container

COPY ./entrypoint.sh /entrypoint.sh

CMD ["/bin/bash", "/entrypoint.sh"]
```

Lets walk through the `Dockerfile` above. The first thing you'll notice is the [`FROM`](https://docs.docker.com/engine/reference/builder/#from) declaration.

```bash
FROM openjdk:8-jdk-alpine
```

In this case, we are using [`openjdk:8-jdk-alpine`](https://github.com/docker-library/openjdk) which provides us with Java 8.

## Installing Dependencies

The next thing we do is install the dependencies we will need using Alpine's package manager: `apk`. You'll notice some
specific flags that keep the container small, including `--no-cache`, as well as everything being contained in a
single [`RUN`](https://docs.docker.com/engine/reference/builder/#run) block.

## Creating a Container User

Within this `RUN` block, you'll notice the `useradd` command.

```bash
adduser -D -h /home/container container
```

::: warning
All Pterodactyl containers must have a user named `container`, and the user home **must** be `/home/container`.
:::

After we create that user, we then define the default container [`USER`](https://docs.docker.com/engine/reference/builder/#user)
as well as a few [`ENV`](https://docs.docker.com/engine/reference/builder/#env) settings to be applied to things running
within the container.

## Work Directory & Entrypoint

One of the last things we do is define a [`WORKDIR`](https://docs.docker.com/engine/reference/builder/#workdir) which
is where everything else will be executed. The `WORKDIR` must be set the `/home/container`.

Finally, we need to copy our [`ENTRYPOINT`](https://docs.docker.com/engine/reference/builder/#entrypoint) script into
the docker image root. This is done using [`COPY`](https://docs.docker.com/engine/reference/builder/#copy), after which
we define the command to be used when the container is started using [`CMD`](https://docs.docker.com/engine/reference/builder/#cmd).
The `CMD` line should always point to the `entrypoint.sh` file.

```bash
COPY ./entrypoint.sh /entrypoint.sh
CMD ["/bin/bash", "/entrypoint.sh"]
```

## Entrypoint Script

In order to complete this `Dockerfile`, we will need an `entrypoint.sh` file which tells Docker how to run this
specific server type.

These entrypoint files are actually fairly abstracted, and the Daemon will pass in the start command as an environment
variable before processing it and then executing the command.

```bash
#!/bin/bash
cd /home/container

# Output Current Java Version
java -version ## only really needed to show what version is being used. Should be changed for different applications

# Replace Startup Variables
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`
echo ":/home/container$ ${MODIFIED_STARTUP}"

# Run the Server
${MODIFIED_STARTUP}
```

The second command, `cd /home/container`, simply ensures we are in the correct directory when running the rest of the
commands. We then follow that up with `java -version` to output this information to end-users, but that is not necessary.

## Modifying the Startup Command

The most significant part of this file is the `MODIFIED_STARTUP` environment variable. What we are doing in this case
is parsing the environment `STARTUP` that is passed into the container by the Daemon. In most cases, this variable
looks something like the example below:

```bash
STARTUP="java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}"
```

::: v-pre
You'll notice some placeholders there, specifically `{{SERVER_MEMORY}}` and `{{SERVER_JARFILE}}`. These both refer to
other environment variables being passed in, and they look something like the example below.
:::

```bash
SERVER_MEMORY=1024
SERVER_JARFILE=server.jar
```

There are a host of different environment variables, and they change depending on the specific service option
configuration. However, that is not necessarily anything to worry about here.

```bash
MODIFIED_STARTUP=`eval echo $(echo ${STARTUP} | sed -e 's/{{/${/g' -e 's/}}/}/g')`
```

::: v-pre
The command above simply evaluates the `STARTUP` environment variable, and then replaces anything surrounded in
curly braces `{{EXAMPLE}}` with a matching environment variable (such as `EXAMPLE`). Thus, our `STARTUP` command:
:::

```bash
java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

Becomes:

```bash
java -Xms128M -Xmx1024M -jar server.jar
```

## Run the Command

The last step is to run this modified startup command, which is done with the line `${MODIFIED_STARTUP}`.

### Note

Sometimes you may need to change the permissions of the `entrypoint.sh` file, on linux you can do this by executing `chmod +x entrypoint.sh` in the directory where the file is.
