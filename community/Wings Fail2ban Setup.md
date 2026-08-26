# Fail2ban wings configuration

Fail2ban is a program that works with iptables to better secure your server and services from brute force login attempts

### Step 1: instal Fail2Ban
(to my best knowledge, iptables will come with fail2ban when you install it, but if not install that too)

`apt-get install fail2ban`

### Step 2: Copy some files, If you already have local files skip this
#### We have to copy .conf to .local files, as Local files will persist through updates

`cd /etc/fail2ban`  
`cp fail2ban.conf fail2ban.local`  
`cp jail.conf jail.local`  

### Step 3 Copy some text into the new local files

`nano /etc/fail2ban/jail.local`

scroll down until you see the actual jail portion of the file, input this text below the [SSHD] block, save it and exit
```
[wings]
enabled = true
port    = 2022
logpath = /var/log/pterodactyl/wings.log
maxretry = 4
findtime = 3600
bantime = -1
backend = systemd
```

### Step 4: Create the filter file and copy some more text

  `cd /etc/fail2ban/conf.d/`  
  `touch wings.conf`  
  `nano wings.conf`  

Copy this text into the newly created file, Save then exit
```
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
```
    
### Step 5: Enable Fail2ban service

`systemctl enable fail2ban`


#### Notes:  
The rules applied to wings are fairly strict so if you feel like you need to adjust them, the settings are as follows  
Max retry is the number of failed attempts someone can do within the time defined in "findtime" before they are banned 
 
example: maxretry = 4 with findtime = 3600 with bantime = -1  

this will allow 4 failed login attempts within 3600 seconds (1 hour) before permanently banning someone  
There are different time modifiers you can use, Most people will be using dd (day) mm (month) yy (year)  
I do suggest you read up on fail2ban docs, you can get highly customised protection from custom configuration  
https://manpages.debian.org/testing/fail2ban/jail.conf.5.en.html#TIME_ABBREVIATION_FORMAT






