[![lien](https://raw.githubusercontent.com/LienJS/Resources/master/logo/header.png)](#)

# lien [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![Version](https://img.shields.io/npm/v/lien.svg)](https://www.npmjs.com/package/lien) [![Downloads](https://img.shields.io/npm/dt/lien.svg)](https://www.npmjs.com/package/lien) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> Another lightweight NodeJS framework. Lien is the link between request and response objects.

## Installation

```sh
$ npm i --save lien
```

## Example

```js
// Dependencies
var Lien = require("lien");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
  , root: __dirname + "/public"
});

// Listen for load
server.on("load", function (err) {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add page
server.page.add("/", function (lien) {
    lien.end("Hello World");
});

// Add a dynamic route
server.page.add("/post/:id", function (lien) {
    lien.end("Post id: " + lien.params.id);
});

server.page.add("/test", "/index.html");
```

## Documentation

### `Lien(opt_options)`
Creates a new Lien instance.

#### Params
- **Object** `opt_options`: An object containing the following properties:
 - `host` (String): The server host.
 - `port` (Integer): The server port.
 - `root` (String): The public directory (default: `__dirname + "/public"`).
 - `cache` (Integer): The number of seconds for keeping the files in cache (default: `300`).
 - `ssl` (Object): An object containing the following fields:
   - `key` (String): The path to the key file.
   - `cert` (String): The path to the cert file.
   - `_key` (String|Buffer): The key file content (defaults to the key file content).
   - `_cert` (String|Buffer): The cert file content (defaults to the cert file content).

#### Return
- **Object** The Lien instance.

### `add(url, fn)`
Adds a new custom handler for specified url.

#### Params
- **String** `url`: The url to listen to.
- **Function** `fn`: The custom handler.

### `exists(url)`
Checks if there are any url handlers.

#### Params
- **String** `url`: The url to listen to.

#### Return
- **Array|Undefined** The array of handlers or `undefined` if there is no event.

### `run(url, lien)`
Executes the custom handlers.

#### Params
- **String** `url`: The url to listen to.
- **Lien** `lien`: The lien object.

#### Return
- **Boolean** `true` if any of the request prevented the response, `false` otherwise.

### `add(route, method, callback)`
Adds a new page route to the Lien instance.

#### Params
- **String|RegExp** `route`: A String or RegExp value that will handle pathnames.
- **String** `method`: The HTTP method. If provided, the callback will be handled only for that type of HTTP method.
- **Function** `callback`: The route handler. It will be called with `lien` object.

### `delete(route, method)`
Deletes a page route.

#### Params
- **String** `route`: Route that should be deleted.
- **String** `method`: The HTTP method.

## How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

 - [`bnotify`](https://github.com/IonicaBizau/bnotify)

 - [`gh-contributions`](https://github.com/IonicaBizau/github-contributions)

 - [`gh.js`](https://github.com/IonicaBizau/gh.js)

 - [`learning-node-file-upload`](https://github.com/IonicaBizau/learning-nodejs)

 - [`learning-nodejs-file-upload`](https://github.com/IonicaBizau/learning-nodejs)

 - [`web-term`](https://github.com/IonicaBizau/web-term)

 - [`wrabbit`](https://github.com/jillix/wrabbit) by jillix

 - [`youtube-album-uploader`](https://github.com/jpchip/youtube-album-uploader) by Jared Chapiewsky

## License

[MIT][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net%2F)&year=2014#license-mit
[website]: http://ionicabizau.net/
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md