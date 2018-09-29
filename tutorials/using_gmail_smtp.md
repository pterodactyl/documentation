# Using Google's SMTP server
[[toc]]

During the panel installation you are required to select and setup a mail server. Google provides a free to use SMTP
server. This is a simple guide on how to utilise this service and cover basics of the functions of it.

## Enabling 2FA
To obtain an app password required for SMTP, the Gmail account being used must have 2-step-authentication enabled for security reasons.
You can enable this on [this site.](https://www.google.com/landing/2step/)

## Generating the app password
Once 2FA is enabled, you need to generate an app password [here](https://security.google.com/settings/security/apppasswords).
Take a note of this as it will be needed later, but **DO NOT SHARE THIS**.

## Continuing in the setup
Use this command to trigger the mail server setup:
```php artisan p:environment:mail```

Use SMTP, and enter `smtp.google.com` for the SMTP host. Use port 465. When prompted to enter a username, enter the Gmail email you
used to create an app password. Then, enter the app password but **do not use your gmail login password**
When given a prompt to enter the email address emails should originate from, you can either enter your Gmail email or use your own
email account on your own domain, but this must be added to your Gmail account. (You can add an address by going to Settings,
Accounts and Import, and adding it in there)
Set the name that emails should appear from to whatever you want to show in users inboxes and chose SSL for the encryption method.

## Applying changes

To apply these changes, run this command.
```service pteroq restart```
