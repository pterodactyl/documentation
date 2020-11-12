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

## cURL Error
There is a List of cURL Errors that can be shown up during an update. Here is an example:
``` bash
[2020-11-12 17:38:38] production.WARNING: GuzzleHttp\Exception\ConnectException: cURL error 7: Failed to connect to panel.cr****ns.net port 8080: Connection refused (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) in /var/www/pterodactyl/vendor/guzzlehttp/guzzle/src/Handler/CurlFactory.php:200
```

Goto the curl Website to understand what this error tells you exactly.

A way to fix it will be added after I found a way to fix it.
