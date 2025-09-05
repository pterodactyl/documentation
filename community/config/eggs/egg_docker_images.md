# Egg Docker Images

[[toc]]


The [Ptero-Eggs yolks repository](https://github.com/Ptero-Eggs/yolks) provides a variety of Docker images (called yolks) specifically designed for use with Pterodactyl eggs.

These images provide the necessary runtime environments for game servers, bots, utilities, databases, and other services.
Pterodactyl eggs run within Docker containers. 
The **Docker image** for an egg defines the base operating system and software environment available to the server. Choosing the right image is important:

- Pterodactyl maintains an official repository of images (called **Yolks**) covering many common games, languages, and services.
- You may also use a [Custom Docker Image](creating_a_custom_image.md) for unique requirements

## Categories of Yolks
### General Purpose

| Image | Description |
|-------|-------------|
| `oses` | Base operating system images used to build other yolks. Includes core utilities for most container environments. |
| `installers` | Includes tools like `curl` and `wget`, commonly used to simplify and speed up installation scripts. |

### Programming Languages

| Image | Description |
|-------|-------------|
| `go` | An environment for Go (Golang) applications. Used for servers or tools written in Go. |
| `java` | Supports running Java applications, including Minecraft servers and Java-based tools. |
| `nodejs` | Provides Node.js and npm for JavaScript-based apps like bots, utilities, etc. |
| `python` | Used to run or build Python applications, scripts, or automation tools. |
| `rust` | Provides an environment for building or running applications developed in Rust. |

### Databases

| Image | Description |
|-------|-------------|
| `mariadb` | A drop-in replacement for MySQL, used for web apps and game server databases. |
| `mongodb` | A NoSQL database suited for dynamic data structures and fast performance. |
| `postgres` | Relational SQL database known for advanced features and data integrity. |
| `redis` | In-memory data structure store, used for caching and high-performance applications. |

### Game Tools

| Image | Description |
|-------|-------------|
| `steamcmd` | Allows downloading and managing game servers from Steam (e.g. ARK, CS:GO, Valheim). |
| `wine` | Runs Windows-based applications in Linux containers—useful for games that don’t have Linux builds. |

### Other

| Image | Description |
|-------|-------------|
| `mono` | Environment for .NET applications using the Mono runtime. Supports C# programs and older .NET games. |
| `voice` | Optimized for voice servers or tools like TeamSpeak or Mumble. |

---

## Architecture Support

Most yolks support both `amd64` and `arm64` architectures. Always check the image documentation to confirm compatibility with your server hardware.

## Custom Images

Requirements:
- Must include all runtime dependencies.
- Must have a `container` user with UID 1000 and home `/home/container`.
- Use Alpine/Debian minimal bases where possible.

If you want to build your own Docker image for an egg, refer to the [Creating a Custom Docker Image](creating_a_custom_image.md) guide for best practices on building and tagging images for Pterodactyl.

## Providing Multiple Images

An egg can offer **multiple Docker images** for the server owner to choose from. To do this, list each image on a new line in the egg’s Docker Image field (in the egg configuration). You can optionally prepend a display name to each image using the format:  
``Display Name|docker/image:tag``

For example, you might offer two Java images for a Minecraft egg:
- Java 17|ghcr.io/pterodactyl/yolks:java_17
- Java 21|ghcr.io/pterodactyl/yolks:java_21

This would present the user with a dropdown choice between **“Java 17”** and **“Java 21”** when deploying the server. The text before the `|` is the friendly name shown in the panel, and the text after the `|` is the actual Docker image to use.

::: tip
If you’re not sure which image to use for your egg, start with one of the [Official Yolks](https://github.com/Ptero-Eggs/yolks)
 that closely matches your server’s requirements. These images are maintained by the community and cover most common use cases.
:::