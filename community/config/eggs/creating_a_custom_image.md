# Creating a Custom Docker Image

[[toc]]

::: warning
This tutorial uses examples from our [`yolks:java_17`](https://github.com/pterodactyl/yolks/tree/master/java/17) docker image,
which can be found on GitHub. This tutorial also assumes some knowledge of [Docker](https://docker.io/), we suggest
reading up if this all looks foreign to you.
:::

## Creating the Dockerfile

The most important part of this process is to create the [`Dockerfile`](https://docs.docker.com/engine/reference/builder/)
that will be used by the Daemon. Due to heavy restrictions on server containers, you must setup this file in a specific manner.

We try to use a [Debian based OS](https://www.debian.org) as much as possible for our images

```bash
FROM        --platform=$TARGETOS/$TARGETARCH eclipse-temurin:17-jdk-jammy

LABEL       author="Matthew Penner" maintainer="matthew@pterodactyl.io"

LABEL       org.opencontainers.image.source="https://github.com/pterodactyl/yolks"
LABEL       org.opencontainers.image.licenses=MIT

RUN 		apt-get update -y \
 			&& apt-get install -y lsof curl ca-certificates openssl git tar sqlite3 fontconfig libfreetype6 tzdata iproute2 libstdc++6 \
 			&& useradd -d /home/container -m container

USER        container
ENV         USER=container HOME=/home/container
WORKDIR     /home/container

COPY        ./../entrypoint.sh /entrypoint.sh
CMD         [ "/bin/bash", "/entrypoint.sh" ]
```

Lets walk through the `Dockerfile` above. The first thing you'll notice is the [`FROM`](https://docs.docker.com/engine/reference/builder/#from) declaration.

```bash
FROM --platform=$TARGETOS/$TARGETARCH eclipse-temurin:17-jdk-jammy
```

The `--platform=$TARGETOS/$TARGETARCH` allows us to specify in the github workflow that we want to build for linux/amd64 and linux/arm64. See [Docker docs](https://docs.docker.com/engine/reference/builder/#from)

In this case, we are using [`eclipse-temurin:17-jdk-jammy`](https://github.com/adoptium/containers/tree/main) which provides us with Java 17.

## Installing Dependencies

The next thing we do is install the dependencies we will need using Debian/Ubuntu's package manager: `apt`. You'll notice some
specific flags `-y` as the docker build is non interactive, as well as everything being contained in a
single [`RUN`](https://docs.docker.com/engine/reference/builder/#run) block. 

::: warning
The dependency `iproute2` is required in every docker container to make the ip command work
:::

## Files In The Docker Image
::: warning
Because the way that Pterodactyl works, it is not possible to store any files within the Docker image at `/home/container`.
:::

All files must be downloaded with the egg install script, this means for example that you can not put your bot files or minecraft server jars in the Docker image as you can with regular docker images.

## Creating a Container User

Within this `RUN` block, you'll notice the `useradd` command.

```bash
 useradd -d /home/container -m container
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
COPY        ./../entrypoint.sh /entrypoint.sh
CMD         [ "/bin/bash", "/entrypoint.sh" ]
```

## Entrypoint Script

In order to complete this `Dockerfile`, we will need an `entrypoint.sh` file which tells Docker how to run this
specific server type.

These entrypoint files are actually fairly abstracted, and the Daemon will pass in the start command as an environment
variable before processing it and then executing the command.

```bash
# Default the TZ environment variable to UTC.
TZ=${TZ:-UTC}
export TZ

# Set environment variable that holds the Internal Docker IP
INTERNAL_IP=$(ip route get 1 | awk '{print $(NF-2);exit}')
export INTERNAL_IP

# Switch to the container's working directory
cd /home/container || exit 1

# Print Java version
printf "\033[1m\033[33mcontainer@pterodactyl~ \033[0mjava -version\n"
java -version

# Convert all of the "{{VARIABLE}}" parts of the command into the expected shell
# variable format of "${VARIABLE}" before evaluating the string and automatically
# replacing the values.
PARSED=$(echo "${STARTUP}" | sed -e 's/{{/${/g' -e 's/}}/}/g' | eval echo "$(cat -)")

# Display the command we're running in the output, and then execute it with the env
# from the container itself.
printf "\033[1m\033[33mcontainer@pterodactyl~ \033[0m%s\n" "$PARSED"
# shellcheck disable=SC2086
exec env ${PARSED}
```

First we set the timezone.
```bash
TZ=${TZ:-UTC}
export TZ
```

Then we make the internal ip avaible in the docker container.
```bash
INTERNAL_IP=$(ip route get 1 | awk '{print $(NF-2);exit}')
export INTERNAL_IP
```

The third command, `cd /home/container`, simply ensures we are in the correct directory when running the rest of the
commands. We then follow that up with `java -version` to output this information to end-users, but that is not necessary.

## Modifying the Startup Command

The most significant part of this file is the `MODIFIED_STARTUP` environment variable. What we are doing in this case
is parsing the environment `STARTUP` that is passed into the container by the Daemon. In most cases, this variable
looks something like the example below:

```bash
STARTUP="java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}"
```

::: v-pre
You'll notice some placeholders there, specifically `{{SERVER_JARFILE}}`. These refer to
other environment variables being passed in, and they look something like the example below.
:::

```bash
SERVER_JARFILE=server.jar
```

There are a host of different environment variables, and they change depending on the specific service option
configuration. However, that is not necessarily anything to worry about here.

```bash
PARSED=$(echo "${STARTUP}" | sed -e 's/{{/${/g' -e 's/}}/}/g' | eval echo "$(cat -)")
```

::: v-pre
The command above simply evaluates the `STARTUP` environment variable, and then replaces anything surrounded in
curly braces `{{EXAMPLE}}` with a matching environment variable (such as `EXAMPLE`). Thus, our `STARTUP` command:
:::

```bash
java -Xms128M -XX:MaxRAMPercentage=95.0 -jar {{SERVER_JARFILE}}
```

Becomes:

```bash
java -Xms128M -XX:MaxRAMPercentage=95.0 -jar server.jar
```

## Run the Command

The last step is to run this modified startup command, which is done with the line `exec env ${PARSED}`.

### Note

Sometimes you may need to change the permissions of the `entrypoint.sh` file, on linux you can do this by executing `chmod +x entrypoint.sh` in the directory where the file is.
