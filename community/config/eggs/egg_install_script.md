# Egg Install Script

[[toc]]

## What is the Install Script?

The install script is where the **egg magic** happens.  

When you click on the **Install Script** tab for the egg, you will see four main parts:

- A large text area to write the script. (Install Script)

- A field where you can select a different eggs script, default set to 'None' (Copy Script From)

- A field to select the **Docker image** in which the install script will run (Script Container).

- A field used to specify the entrypoint command used for the script, usually 'bash' (Script Entrypoint Command)

You can choose a special Docker image for the installation process (separate from the server’s runtime image). Pterodactyl provides some “installer” images (Alpine or Debian based) that include common utilities like `curl`, `wget`, `unzip`, `git`, etc., to help with installation tasks. If you’re not sure, use one of the official installer images:

- `ghcr.io/ptero-eggs/installers:alpine`

- `ghcr.io/ptero-eggs/installers:debian`

- `ghcr.io/ptero-eggs/installers:ubuntu`

Then, in the script text area, write the shell commands needed to set up the server.

::: warning
Anything you install or change **outside of `/mnt/server`** in the install container will **not persist** to the runtime server. The install script runs in a temporary environment. Only the `/mnt/server` directory (which corresponds to the server’s file directory) is transferred to the actual server container. If your server needs specific system packages or libraries, those must be installed in the **runtime Docker image**, not just in the install script.
:::

**How the install process works:**

1. **Create the server directory:** The script typically starts by making sure the `/mnt/server` directory exists and is the current working directory.  
   - For example, you might use:  
     ```bash
     mkdir -p /mnt/server
     cd /mnt/server
     ```  
   - (In many official scripts, the container’s working directory is already set to `/mnt/server`, but it’s good practice to ensure it.)

2. **Download and prepare files:** Fetch any necessary files (server binaries, mods, configs, etc.) from the internet or local sources.  
   - Common tools for this are `curl`, `wget`, `git clone`, or using a command pipeline like `curl ... | tar ...`.  
   - For example, you might download a ZIP of the server software and then unzip it.

3. **Set up configurations:** If your server requires an initial configuration file or certain directory structure, you can create those here.  
   - For instance, you might generate a default config file, or rename files, etc.  
   - You can also use the values of variables by referencing environment variables (e.g. `${MAX_PLAYERS}` in the script will use the value from a custom egg variable if one exists).

4. **Install any additional dependencies (if needed for installation):** In some cases, the install process itself might require extra tools or packages. Since the official installer images come with common tools, this is rarely needed, but you could install others (e.g., `apk add ...` or `apt install ...`) in the install container. Remember, these tools won’t be present in the runtime container, so this step is only for things needed *during installation* (not for actually running the server).

## Example Install Script  

```sh
#!/bin/bash
# Create and navigate to the server directory
mkdir -p /mnt/server
cd /mnt/server || exit 1

# Install dependencies required for installation
apt update && apt install -y unzip wget

# Download necessary files
wget -O game-server.zip "https://example.com/game-server.zip"
unzip game-server.zip
rm game-server.zip

# Set up configuration
echo "max_players=32" > config.cfg

# Ensure correct permissions
chown -R containeruser:containergroup /mnt/server
chmod -R 755 /mnt/server
```

## What Happens After Installation?

When the install script finishes running:

- All files and folders **inside** `/mnt/server` (the server’s directory) are retained and moved to the server’s persistent storage.

- The install container is destroyed. Then the server’s normal runtime container (using the Docker image specified in the egg’s configuration) will start up, and it will have all the files that were in `/mnt/server` available.

In summary, the install script’s job is to populate `/mnt/server` with everything the server needs. Once that’s done, those files persist, and then the server can be launched in the proper environment.
