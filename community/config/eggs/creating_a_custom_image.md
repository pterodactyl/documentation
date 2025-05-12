# Creating a Custom Docker Image

[[toc]]

:::warning
All Pterodactyl containers must have a user named `container`, and the user home must be `/home/container`
:::
This guide explains how to create a custom Docker image for use with Pterodactyl eggs, using a modern base example from the [Ptero-Eggs yolks repository](https://github.com/Ptero-Eggs/yolks/tree/main).

Docker images define the environment in which a server runs—what software is installed, what versions are used, and how everything is launched. Custom images allow you to add packages or modify behavior beyond what official yolks provide.

## Dockerfile Example

Here’s a full Dockerfile example using Java 21 as the base image:

```dockerfile
FROM --platform=$TARGETOS/$TARGETARCH eclipse-temurin:21-jdk-jammy

LABEL author="Matthew Penner" maintainer="matthew@pterodactyl.io"
LABEL org.opencontainers.image.source="https://github.com/pterodactyl/yolks"
LABEL org.opencontainers.image.licenses=MIT

ENV   DEBIAN_FRONTEND=noninteractive

RUN apt update -y \
    && apt install -y \
    curl \
    lsof \
    ca-certificates \
    openssl \
    git \
    tar \
    sqlite3 \
    fontconfig \
    tzdata \
    iproute2 \
    libfreetype6 \
    tini \
    zip \
    unzip

RUN useradd -m -d /home/container -s /bin/bash container

USER container
ENV USER=container HOME=/home/container
WORKDIR /home/container

COPY --chown=container:container ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["/entrypoint.sh"]
```

## Breakdown of the Dockerfile

### Base Image
```dockerfile
FROM --platform=$TARGETOS/$TARGETARCH eclipse-temurin:21-jdk-jammy
```
Uses Eclipse Temurin Java 21 JDK on Ubuntu Jammy. The `--platform` flag ensures compatibility with different system architectures.

### Metadata Labels
```dockerfile
LABEL author="..."
```
Provides metadata such as author, source, and license. Useful for documentation.

### Dependencies
```dockerfile
RUN apt update -y && apt install -y [...]
```
Installs useful server packages:

- `curl`, `lsof`, `openssl`: Common CLI tools.
- `fontconfig`, `libfreetype6`: Support Java-based GUI rendering.
- `tini`: Handles signal forwarding and zombie reaping.

### User Setup


```dockerfile
RUN useradd -m -d /home/container -s /bin/bash container
```
Creates a non-root user `container` to enhance security.

### Switch User & Set Environment
```dockerfile
USER container
ENV USER=container HOME=/home/container
```
Switches to the new user and sets key environment variables.

### Working Directory
```dockerfile
WORKDIR /home/container
```
Sets the default working directory.

### Entrypoint Setup
```dockerfile
COPY --chown=container:container ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
```
Copies the startup script and ensures it’s executable.

### Entry Command
```dockerfile
ENTRYPOINT ["/usr/bin/tini", "-g", "--"]
CMD ["/entrypoint.sh"]
```
Uses `tini` to launch the container and execute the custom startup script.

## Example entrypoint.sh

In order to complete this Dockerfile, we will need an entrypoint.sh file which tells Docker how to run this specific server type.

These entrypoint files are actually fairly abstracted, and the Daemon will pass in the start command as an environment variable before processing it and then executing the command.

#### This script pairs with the Dockerfile above:

```bash
#!/bin/bash

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
eval ${PARSED}
```

### Breakdown

- Navigates to the working directory.
- Outputs the Java version for confirmation.
- Processes and expands the Pterodactyl `STARTUP` variable.
- Executes the startup command.


## Final Notes

- User home must be `/home/container`
- All Pterodactyl containers must have a user named `container`
- Always run as a **non-root** user in Pterodactyl containers.
- Build and test locally with: `docker build -t my-image .`
- Push images to Docker Hub or private registry and specify them in the egg under Docker Image, or run the image locally first if you want to ensure it functions as expected

Creating a custom Docker image lets you fully control the server for uncommon games or special dependencies.