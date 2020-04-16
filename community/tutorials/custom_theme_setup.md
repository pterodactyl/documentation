# Creating a theme for Pterodactyl
This tutorial briefly covers how to create a theme for Pterodactyl without overwriting the main theme files.

## Using CLI
Begin by going to your panel's main directory (typically installed at `/var/www/pterodactyl`). The command below is a straightforward setup that will cover the majority of the functions all for you (such as Theme Name, Views Location, Assets Location etc).
                                                                                                               
``` bash
php artisan theme:create
```
This command will activate the theme wizard. Besides the name, the defaults will suffice. See the below example.

::: warning 
Do not create the theme named as `pterodactyl` as that is Pterodactyl's main design and should **NOT** be overwritten. 
:::

``` bash
 Give theme name:
 > (Enter Theme Name Here) (Example: MyThemeHere)

 Where will views be located? []:
 > (Press Enter)

 Where will assets be located? []:
 > /themes/(MyThemeHere) (Example: /themes/MyThemeHere)

 Extends an other theme? (yes/no) [no]:
 > (Press Enter)
```

If you have done it correctly, the summary should be like this:
Summary:
- Theme name: `MyThemeHere`
- Views Path: `/var/www/pterodactyl/resources/themes/MyThemeHere`
- Asset Path: `/var/www/pterodactyl/public/themes/MyThemeHere`
- Extends Theme: No

```bash
 Create Theme? (yes/no) [yes]:
 > (Press Enter)
```

If the summary on your system matches the one above, then the initial theme has been created correctly!

### Set your newly created theme as default
Place your downloaded theme in the correct directory **without overwriting** the default Pterodactyl theme. See the following examples:

Your `public` folder into `/var/www/pterodactyl/public/themes/MyThemeHere/`

Your `resources` folder into `/var/wwww/pterodactyl/resources/themes/MyThemeHere/`

### Setting your theme name in .env
After creating your theme and uploading those theme files correctly, you need to edit your `.env` (environment) file next.
Open up your `.env` file and locate the `APP_THEME=pterodactyl` line. Change it to `APP_THEME=MyThemeHere` (case-sensitive) and save it.

When done correctly, your panel will now load the new/custom theme correctly without any issues.
