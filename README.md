
[![lien](https://raw.githubusercontent.com/LienJS/Resources/master/logo/header.png)](#)

# lien

 [![PayPal](https://img.shields.io/badge/%24-paypal-f39c12.svg)][paypal-donations] [![AMA](https://img.shields.io/badge/ask%20me-anything-1abc9c.svg)](https://github.com/IonicaBizau/ama) [![Version](https://img.shields.io/npm/v/lien.svg)](https://www.npmjs.com/package/lien) [![Downloads](https://img.shields.io/npm/dt/lien.svg)](https://www.npmjs.com/package/lien) [![Get help on Codementor](https://cdn.codementor.io/badges/get_help_github.svg)](https://www.codementor.io/johnnyb?utm_source=github&utm_medium=button&utm_term=johnnyb&utm_campaign=github)

> Another lightweight NodeJS framework. Lien is the link between request and response objects.

## :cloud: Installation

```sh
$ npm i --save lien
```


## :clipboard: Example



```js
// Dependencies
var Lien = require("lien");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
  , public: __dirname + "/public"
});

// Listen for load
server.on("load", err => {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add page
server.addPage("/", lien => {
    lien.end("Hello World");
});

// Add a dynamic route
server.addPage("/post/:id", lien => {
    lien.end("Post id: " + lien.params.id);
});

server.addPage("/test", "/index.html");
server.errorPages();

server.on("serverError", err => {
    console.log(err.stack);
});
```

## :memo: Documentation


### `LienCreator(req, res)`
Creates the `lien` object.

#### Params
- **Object** `req`: The request object.
- **Object** `res`: The response object.

#### Return
- **Lien** The lien object.

### `redirect(newUrl, query)`
Redirects the client to another url.

#### Params
- **String** `newUrl`: The new url to redirect to.
- **Boolean|Object** `query`: If `true`, the request querystring parameters will be appended. If it's an object, it will be merged with the request querystring parameters.

### `startSession(data)`
Starts a session.

#### Params
- **Object** `data`: The session data.

### `setSessionData(data)`
Sets the session data.

#### Params
- **Object** `data`: The session data.

### `getSessionData(field)`
Returns the session data object/specific field.

#### Params
- **Field** `field`: A specific field to get from the session object.

#### Return
- **Value|Object** The field value. If a field is not specified, the whole session data object is returned.

### `destroySession()`
Destroys the session.

### `header(name, value)`
Gets/sets/deletes headers.

#### Params
- **String** `name`: The header name.
- **String** `value`: The header value to set. If `null`, the header will be *removed*.

#### Return
- **String** The specified header value from the request object.

### `apiMsg(msg, status)`
Sends to the client a JSON object containing the `message` field.

#### Params
- **String** `msg`: The API message.
- **Number** `status`: The status code (default: `200`).

### `apiError(msg, status)`
Like `apiMsg`, but by default with a status code of `422`.

#### Params
- **String** `msg`: The API message.
- **Number** `status`: The status code (default: `422`).

### `end(content, status, contentType, headers)`
Ends the response sending the content.

#### Params
- **Anything** `content`: The content that should be sent to the response.
- **Number** `status`: The status code.
- **String** `contentType`: The content type (e.g. `"json"`).
- **Object** `headers`: Additional headers to send in the response.

### `cookie(cookie, value)`
Sets, gets or deletes the cookie.

#### Params
- **String** `cookie`: The searched cookie.
- **String** `value`: If provided and it not `null`, the cookie will be set. If it's null, the cookie will be deleted. If `value` is not provided, the cookie value will be returned.

#### Return
- **String** `null`, if the cookie was deleted. `undefined` if the cookie doesn't exist. The cookie value if this exists.

### `file(path, customRoot)`
Serves a file to the response.

#### Params
- **String** `path`: Relative path to the file.
- **String** `customRoot`: Absolute path to the root directory (optional).

### `Lien(opt_options)`
Creates a new Lien instance.

It extends the `EventEmitter` class.

It emits the following events:

 - `load` (err): After the server is started. If there are no errors, the `err` will be null.
 - `serverError` (err, req, res): The server unexpected error.

#### Params
- **Object** `opt_options`: An object containing the following properties:
 - `host` (String): The server host.
 - `port` (Integer): The server port.
 - `session` (Boolean|Object): Enable the session support. If it's an object, it will be merged with the following defaults and passed to [`express-session`](https://github.com/expressjs/session):
   - `secret` (String): This is the secret used to sign the session ID cookie (default: "lien server").
   - `resave` (Boolean): Forces the session to be saved back to the session store, even if the session was never modified during the request (default: false).
   - `saveUninitialized` (Boolean): Forces a session that is "uninitialized" to be saved to the store (default: `true`).
   - `cookie` (Object): The cookie [options](https://github.com/expressjs/cookie-parser).
   - `storeOptions` (Object): The [MongoStore options](https://github.com/kcbanner/connect-mongo).
   - `store`: (Object): A custom store object (optional, as long `storeOptions` is provided).
 - `public` (String|Array): The path to the public directory or an array of arrays in this format: `["/url/of/static/dir", "path/to/static/dir"]`.

   Example:

   ```js
   [
     ["/images", "path/to/images"]
   , ["/", "path/to/public"]
   ]
   ```

 - `ssl` (Object): An object containing the following fields:
     - `key` (String): The path to the key file.
     - `cert` (String): The path to the cert file.
     - `_key` (String|Buffer): The key file content (defaults to the key file content).
     - `_cert` (String|Buffer): The cert file content (defaults to the cert file content).

 - `errorPages` (Object):
   - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
   - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.

 - `logErrors` (Boolean): Log the server errors (default: `true`).

#### Return
- **Object** The Lien instance.

### `addPage(url, method, output)`
Adds a new page to be handled.

#### Params
- **String** `url`: The page url.
- **String** `method`: The request methods to be handled (default: `"all"`).
- **Function** `output`: A function receiving the `lien` object as parameter. If can be a path serving a public file.

### `errorPages(options)`
Handle the error pages.

#### Params
- **Object** `options`: An object containing the following fields:
 - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
 - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].

## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify-server-prebuilt`](https://bitbucket.org/bloggify/bloggify-server-prebuilt#readme)—Bundled and minified Bloggify server.
 - [`bnotify`](https://github.com/IonicaBizau/bnotify)—A notification system written in NodeJS using the BAT platform.
 - [`gh-contributions`](https://github.com/IonicaBizau/github-contributions)—A tool that generates a repository which being pushed into your GitHub account creates a nice contributions calendar.
 - [`learning-node-file-upload`](https://github.com/IonicaBizau/learning-nodejs)—Learning how file uploads work in a NodeJS server.
 - [`learning-nodejs-file-upload`](https://github.com/IonicaBizau/learning-nodejs)—Learning how file uploads work in a NodeJS server.
 - [`test-youtube-api`](https://github.com/IonicaBizau/test-youtube-api)—Test Youtube API NodeJS module
 - [`web-term`](https://github.com/IonicaBizau/web-term)—A full screen terminal in your browser.
 - [`wrabbit`](https://github.com/jillix/wrabbit) (by jillix)—Wrap scripts by providing the wrapping function.
 - [`youtube-album-uploader`](https://github.com/jpchip/youtube-album-uploader) (by Jared Chapiewsky)—Uploads an mp3 album to Youtube

## :scroll: License

[MIT][license] © [Ionică Bizău][website]

[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(http%3A%2F%2Fionicabizau.net%2F)&year=2014#license-mit
[website]: http://ionicabizau.net/
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
