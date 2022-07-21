# Fail2ban wings configuration

Fail2ban is a program that works with iptables to better secure your server and services from brute force login attempts

### Step 1: if you havent already Using your preferred package manager
(to my best knowledge, iptables will come with fail2ban when you install it, but if not install that too)

`apt-get install fail2ban`

### Step 2: After you install Fail2Ban Copy some files, If you already have local files, skip these steps
#### We have to copy .conf to .local files, as .conf may be wiped with updates. Local files will persist

`cd /etc/fail2ban`  
`cp fail2ban.conf fail2ban.local`  
`cp jail.conf jail.local`  

### Step 3 Copy some text into the new local files using your favorite text editor, here we're going to be using nano

`nano /etc/fail2ban/jail.local`

scroll down until you see the actual jail portion of the file, input this text below the [SSHD] block, save it and exit

    [wings]
    enabled = true
    port    = 2022
    logpath = /var/log/pterodactyl/wings.log
    maxretry = 4
    findtime = 3600
    bantime = -1
    backend = systemd


### Step 4: Create the filter file and copy some more text

  `cd /etc/fail2ban/conf.d/`  
  `touch wings.conf`  
  `nano wings.conf`  

Copy this text into the newly created file, Save then exit

    # Fail2Ban filter for wings (Pterodactyl daemon)
    #
    #
    #
    # "WARN: [Sep  8 18:51:00.414] failed to validate user credentials (invalid format) ip=<HOST>:51782 subsystem=sftp username=logout"
    #
    
    [INCLUDES]
    
    before = common.conf
    
    [Definition]

    _daemon = wings

    failregex = failed to validate user credentials \([^\)]+\) ip=<HOST>:.* subsystem=sftp username=.*$

    ignoreregex =

    [Init]

    datepattern = \[%%b %%d %%H:%%M:%%S.%%f\]
    
### Step 5 enable the Fail2ban service to boot on startup and your done :D

`systemctl enable fail2ban`
