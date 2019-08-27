# Creating a theme for Pterodactyl
This tutorial briefly covers how to create a theme for Pterodactyl without overwriting the main theme files.

## Using CLI
To begin, we will be using php artisan as it's the easiest and quickest method to do so than igaster's method. Let's begin by creating by going to your panel's main directory typically installed at `/var/www/pterodactyl`. The command below is a straight-forward setup. This setup will cover
the majority of the functions all for you such as Theme Name, Views Location, Assets Location etc. So let's create a theme!
                                                                                                               
``` bash
php artisan theme:create
```
This command will enter you into a step by step procedure. Here are the ones you would want to fill in.
::: warning Do not create the theme named as `pterodactyl` as that is Pterodactyl's main design and should NOT be overwritten. :::
``` bash
Give theme name::
> (Enter Theme Name Here) (Example: MyThemeHere or theme1)

 Where will views be located? []:
 > (Press Enter)

 Where will assets be located? []:
 > (Press Enter)

 Extends an other theme? (yes/no) [no]:
 > (Press Enter)
```

If you have done it correctly, the summary should be like this:
Summary:
- Theme name: `(MyThemeHere)`
- Views Path: `/var/www/pterodactyl/resources/themes/MyThemeHere`
- Asset Path: `/var/www/pterodactyl/public/MyThemeHere`
- Extends Theme: No

```bash
 Create Theme? (yes/no) [yes]:
 > (Press Enter)
```

If the above shows as that then Congratulations! You have created your theme correctly! Now let's set your newly created theme as default.
Go ahead and place your downloaded theme in the correct directory **without overwriting** the default Pterodactyl theme such as the following:

Your `public` folder into /var/www/pterodactyl/public/themes/MyThemeHere/

Your `resources` folder into /var/wwww/pterodactyl/resources/themes/MyThemehere/

### Setting your theme name in .env
After creating your theme correctly and uploading the theme files correctly, you should edit your `.env` file next.
Open up your .env file and locate `APP_THEME=pterodactyl` line and change it to `APP_THEME=MyThemeHere` (case-sensitive) and save it.

If done correctly, your panel will now load your theme correctly without any issues.
