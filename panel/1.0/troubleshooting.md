# Troubleshooting

[[toc]]

## Reading Error Logs
If you ever encounter an unexpected error with the Panel the first thing you will likely be asked for is the logs.
To retrieve these, simply execute the command below which will output the last 100 lines of the Panel's log file.

``` bash
tail -n 100 /var/www/pterodactyl/storage/logs/laravel-$(date +%F).log
```

### Parsing the Error
When you run the command above, you'll probably be hit with a huge wall of text that might scare you. Fear not,
this is simply a stacktrace leading to the cause of the error, and you can actually ignore almost all of it when
looking for the cause of the error. Lets take a look at some example output below, which has been truncated to
make this easier to follow with.

```
#70 /srv/www/vendor/laravel/framework/src/Illuminate/Foundation/Http/Kernel.php(116): Illuminate\Foundation\Http\Kernel->sendRequestThroughRouter(Object(Illuminate\Http\Request))
#71 /srv/www/public/index.php(53): Illuminate\Foundation\Http\Kernel->handle(Object(Illuminate\Http\Request))
#72 {main}
[2018-07-19 00:50:24] local.ERROR: ErrorException: file_put_contents(/srv/www/storage/framework/views/c9c05d1357df1ce4ec8fc5df78c16c493b0d4f48.php): failed to open stream: Permission denied in /srv/www/vendor/laravel/framework/src/Illuminate/Filesystem/Filesystem.php:122
Stack trace:
#0 [internal function]: Illuminate\Foundation\Bootstrap\HandleExceptions->handleError(2, 'file_put_conten...', '/srv/www/vendor...', 122, Array)
#1 /srv/www/vendor/laravel/framework/src/Illuminate/Filesystem/Filesystem.php(122): file_put_contents('/srv/www/storag...', '<?php $__env->s...', 0)
#2 /srv/www/vendor/laravel/framework/src/Illuminate/View/Compilers/BladeCompiler.php(122): Illuminate\Filesystem\Filesystem->put('/srv/www/storag...', '<?php $__env->s...')
#3 /srv/www/vendor/laravel/framework/src/Illuminate/View/Engines/CompilerEngine.php(51): Illuminate\View\Compilers\BladeCompiler->compile('/srv/www/resour...')
#4 /srv/www/vendor/laravel/framework/src/Illuminate/View/View.php(142): Illuminate\View\Engines\CompilerEngine->get('/srv/www/resour...', Array)
#5 /srv/www/vendor/laravel/framework/src/Illuminate/View/View.php(125): Illuminate\View\View->getContents()
```

The first thing you'll want to do is follow the chain of numbers _up_ until you find `#0`, this will be the function that
triggered the exception. Right above line 0 you will see a line that has the date and time in brackets, `[2018-07-19 00:50:24]`
above for example. This line will be the human readable exception that you can use to understand what went wrong.

### Understanding the Error
In the example above we can see that the actual error was:

```
local.ERROR: ErrorException: file_put_contents(...): failed to open stream: Permission denied in /srv/www/vendor/laravel/framework/src/Illuminate/Filesystem/Filesystem.php:122
```

From this error we can determine that there was an error performing a [file_put_contents()](http://php.net/manual/en/function.file-put-contents.php) call, and the error was
that we couldn't open the file because permissions were denied. Its okay if you don't understand the error at all, but
it does help you get faster support if you're able to provide these logs, and at least find the source of the error.
Sometimes the errors are pretty straightforward and will tell you exactly what went wrong, such as a `ConnectionException`
being thrown when the Panel can't connect to the Daemon.

### Utilizing GREP
If you're trying to go through a bunch of errors quickly, you can use the command below which will limit the results returned to only
be the actual error lines, without all of the stack traces.

``` bash
tail -n 1000 /var/www/pterodactyl/storage/logs/laravel-$(date +%F).log | grep "\[$(date +%Y)"
```

## Cannot Connect to Server Errors
### Basic Debugging Steps
* Check that Wings is running, and not reporting errors. Use `systemctl status wings` to check the current status of
  the process.
* Check your browser's console by pressing `Ctrl + Shift + J` (in Chrome) or `Cmd + Alt + I` (in Safari). If there is
a red error in it, chances are that it will narrow down the potential problem.
* Make sure Wings is properly installed and the active configuration matches the configuration shown under
`Admin -> Node -> Configuration` in the Panel.
* Check that the Wings ports are open on your firewall. Wings uses ports `8080` or `8443` for HTTP(s) traffic,
and `2022` for SFTP traffic.
* Ensure you have AdBlock disabled or whitelisted for your Panel and Wings domains.
* Check that the Panel can reach Wings using the domain that is configured on the Panel. Run `curl
https://domain.com:8080` on the Panel server and ensure that it can successfully connect to Wings.
* Ensure that you are using the correct HTTP scheme for your Panel and Wings. If the Panel is running over HTTPS
  Wings will also need to be running on HTTPS.

### More Advanced Debugging Steps
* Stop Wings and run `wings --debug` to see if there are any errors being output. If so, try resolving them manually,
  or reach out on [Discord](https://discord.gg/pterodactyl) for more assistance.
* Check your DNS and ensure that the response you receive is the one you expect using a tool such as `nslookup` or `dig`.
* If you use CloudFlare make sure that the orange cloud is disabled for your Wings or Panel `A` records.
* Make sure when using Wings behind a firewall — pfSense, OpenSwitch, etc. — that the correct NAT settings to access
the Wing's ports from the outside network are setup.
* If nothing is working so far, check your own DNS settings and consider switching DNS servers.
* When running the Panel and Wings on one server it can sometimes help if to add an entry in `/etc/hosts` that directs
the public IP back to the server. Sometimes the reverse path is also needed, so you may need to add an entry to your
servers `/etc/hosts` file that points the Panel's domain to the correct IP.
* When running Wings and the Panel on separate VM's using the same adapter make sure the VM's can connect to each
other. Promiscuous mode might be needed.

## Invalid MAC Exception
::: warning
This error should never happen if you correctly follow our installation and upgrade guides. The only time we have
ever seen this error occur is when you blindly restore the Panel database from a backup and try to use a fresh
installation of the Panel.

When restoring backups you should _always_ restore the `.env` file!
:::

Sometimes when using the Panel you'll unexpectedly encounter a broken page, and upon checking the logs you'll see
an exception mentioning an invalid MAC when decrypting. This error is caused by mismatched `APP_KEY`s in your `.env` file
when the data was encrypted versus decrypted.

If you are seeing this error the only solution is to restore the `APP_KEY` from your `.env` file. If you have lost that
original key there is no way to recover the lost data.

## SELinux Issues
On systems with SELinux installed you might encounter unexpected errors when running redis or attempting to connect
to the daemon to perform actions. These issues can generally be resolved by executing the commands below to allow
these programs to work with SELinux.
 
### Redis Permissions Errors
``` bash
audit2allow -a -M redis_t
semodule -i redis_t.pp
```

### Wings Connection Errors
``` bash
audit2allow -a -M http_port_t
semodule -i http_port_t.pp
```

## FirewallD issues
If you are on a RHEL/CentOS server with `firewalld` installed you may have broken DNS.

```
firewall-cmd --permanent --zone=trusted --change-interface=pterodactyl0
firewall-cmd --reload
```

Restart `docker` and `wings` after running these to be sure the rules are applied.
