
[![lien](https://raw.githubusercontent.com/LienJS/Resources/master/logo/header.png)](#)

# lien

 [![Support me on Patreon][badge_patreon]][patreon] [![Buy me a book][badge_amazon]][amazon] [![PayPal][badge_paypal_donate]][paypal-donations] [![Travis](https://img.shields.io/travis/LienJS/Lien.svg)](https://travis-ci.org/LienJS/Lien/) [![Version](https://img.shields.io/npm/v/lien.svg)](https://www.npmjs.com/package/lien) [![Downloads](https://img.shields.io/npm/dt/lien.svg)](https://www.npmjs.com/package/lien)

> An easy to use web framework for Node.js.

## :cloud: Installation

```sh
$ npm i --save lien
```


## :clipboard: Example



```js
const Lien = require("lien");

// Init lien server
const server = new Lien({
    port: 9000
  , public: `${__dirname}/public`
});

// Listen for load
server.on("load", err => {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add page
server.get("/", lien => {
    lien.end("Hello World");
});

// Add a dynamic route
server.get("/post/:id", lien => {
    lien.end("Post id: " + lien.params.id);
});

// Add a static file
server.get("/test", "index.html");

// Listen for server errors
server.on("serverError", err => {
    console.log(err.stack);
});
```

## :question: Get Help

There are few ways to get help:

 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:
 3. For direct and quick help from me, you can [use Codementor](https://www.codementor.io/johnnyb). :rocket:


## :memo: Documentation


### `LienCreator(req, res, next, server)`
Creates the `lien` object.

#### Params
- **Object** `req`: The request object.
- **Object** `res`: The response object.
- **Function** `next`: The `next` middleware function.
- **Object** `server`: The `Lien` server instance.

#### Return
- **Lien** The lien object.

### `next()`
Go to the next middleware handler.

#### Return
- **Lien** The `Lien` instance.

### `redirect(newUrl, query)`
Redirects the client to another url.

#### Params
- **String** `newUrl`: The new url to redirect to.
- **Boolean|Object** `query`: If `true`, the request querystring parameters will be appended. If it's an object, it will be merged with the request querystring parameters.

### `render(template, data)`
Renders a template to the client.

#### Params
- **String** `template`: The template name.
- **Object** `data`: The template data.

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
- **Lien** The Lien instance.

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
 - `serverError` (err, req, res): This is emitted when something goes wrong after the server is started.
 - `error` (err): Errors which may appear during the server initialization.

#### Params
- **Object** `opt_options`: An object containing the following properties:
    - `host` (String): The server host.
    - `port` (Integer): The server port. `process.env.PORT` is used, default is `3000`.
    - `session` (Boolean|Object): Enable the session support. If it's an object, it will be merged with the following defaults and passed to [`express-session`](https://github.com/expressjs/session):
      - `secret` (String): This is the secret used to sign the session ID cookie (default: "lien server").
      - `resave` (Boolean): Forces the session to be saved back to the session store, even if the session was never modified during the request (default: false).
      - `saveUninitialized` (Boolean): Forces a session that is "uninitialized" to be saved to the store (default: `true`).
      - `cookie` (Object): The cookie [options](https://github.com/expressjs/cookie-parser).
      - `storeOptions` (Object): The session store options. These options are passed to the session store you choose.
      - `store`: (String|Function): The session store name or function. By default it's using a memory store if the session is enabled.
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

    - `views`
      - `path` (String): The path to the views directory.
      - `name` (String): The view engine name.

    - `errorPages` (Object):
      - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
      - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.
      - `badCsrf` (String|Function):  The path to a custom bad CSRF page or a function receiving the lien object as parameter. This can be used to serve custom bad CSRF errors.

    - `logErrors` (Boolean): Log the server errors (default: `true`).
    - `csrf` (Object): The CSRF options. These are passed to [`csurf`](https://github.com/expressjs/csurf)

#### Return
- **Object** The Lien instance.

### `addStaticPath(url, localPath)`
Adds a new static path to the server.

#### Params
- **String** `url`: The static path url endpoint.
- **String** `localPath`: The local path to the directory.

### `addPage(url, method, output)`
Adds a new page to be handled.

#### Params
- **String** `url`: The page url.
- **String|Object** `method`: The request methods to be handled (default: `"all"`) or an object:
   - `method` (String): The HTTP method.
   - `before` (Array|Function): A function or an array of middleware functions to be executed *before* the main function.
   - `after` (Array|Function): A function or an array of middleware functions to be executed *after* the main function.
- **Function** `output`: A function receiving the `lien` object as parameter. If can be a path serving a public file.

### `errorPages(options)`
Handle the error pages.

#### Params
- **Object** `options`: An object containing the following fields:
 - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
 - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.

### `getHooks(type, url, method)`
Gets the transformer for a url.

#### Params
- **String** `type`: The hook type (`before` or `after`).
- **String** `url`: The url.
- **String** `method`: The method.

#### Return
- **Transformer** The transformer (if it exists) or `null`.

### `getHooksStrict(type, url, method)`
Similar to `getHooks`, but doesn't concat hooks based on the regex
matching but only if they are the same regex.

#### Params
- **String** `type`: The hook type (`before` or `after`).
- **String** `url`: The url.
- **String** `method`: The method.

#### Return
- **Transformer** The transformer (if it exists) or `null`.

### `insertHook(type, url, method, trans)`
Inserts a new hook.

#### Params
- **String** `type`: The hook type (`before`, `after`, `custom:name`).
- **String** `url`: The url.
- **String** `method`: The method.
- **Transformer** `trans`: The transformer to insert.

#### Return
- **Transformer** The inserted transformer.

### `hook(where, url, method, cb, transType)`
Adds a new hook.

#### Params
- **String** `where`: The hook type (`before` or `after`).
- **String** `url`: The route url.
- **String** `method`: The HTTP method.
- **Function** `cb`: The callback function.
- **Number** `transType`: The transformer type.

### `before(url, method, cb, transType)`
Adds a before hook. It will handle all the subroutes of the `url`.

#### Params
- **String** `url`: The route url.
- **String** `method`: The HTTP method.
- **Function** `cb`: The callback function.
- **Number** `transType`: The transformer type.

### `after(url, method, cb, transType)`
Adds a before hook. It will handle all the subroutes of the `url`.

#### Params
- **String** `url`: The route url.
- **String** `method`: The HTTP method.
- **Function** `cb`: The callback function.
- **Number** `transType`: The transformer type.

### `use(url, method, cb, transType)`
Use this function to add middleware handlers.

#### Params
- **String** `url`: The route url.
- **String** `method`: The HTTP method.
- **Function** `cb`: The callback function.
- **Number** `transType`: The transformer type.

### `add(url, method, cb)`
Adds a new middleware. **Note**: This will *not* trigger the hooks.

#### Params
- **String** `url`: The endpoint url.
- **String** `method`: The HTTP method (default: `all`).
- **Function** `cb`: The callback function.



## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].


## :sparkling_heart: Support my projects

I open-source almost everything I can, and I try to reply everyone needing help using these projects. Obviously,
this takes time. You can integrate and use these projects in your applications *for free*! You can even change the source code and redistribute (even resell it).

However, if you get some profit from this or just want to encourage me to continue creating stuff, there are few ways you can do it:

 - Starring and sharing the projects you like :rocket:
 - [![PayPal][badge_paypal]][paypal-donations]—You can make one-time donations via PayPal. I'll probably buy a ~~coffee~~ tea. :tea:
 - [![Support me on Patreon][badge_patreon]][patreon]—Set up a recurring monthly donation and you will get interesting news about what I'm doing (things that I don't share with everyone).
 - **Bitcoin**—You can send me bitcoins at this address (or scanning the code below): `1P9BRsmazNQcuyTxEqveUsnf5CERdq35V6`

    ![](https://i.imgur.com/z6OQI95.png)

Thanks! :heart:


## :dizzy: Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:


 - [`bloggify-prebuilt`](https://github.com/Bloggify/bloggify-prebuilt#readme)—The prebuilt Bloggify version.
 - [`bloggify-server-prebuilt`](https://bitbucket.org/bloggify/bloggify-server-prebuilt#readme)—Bundled and minified Bloggify server.
 - [`bnotify`](https://github.com/IonicaBizau/bnotify)—A notification system written in NodeJS using the BAT platform.
 - [`chewb-youtube-uploader`](https://github.com/samradical/youtube-uploader) (by Sam Elie)—Wrapper tool around a great uploader.
 - [`gh-contributions`](https://github.com/IonicaBizau/github-contributions)—A tool that generates a repository which being pushed into your GitHub account creates a nice contributions calendar.
 - [`learning-node-file-upload`](https://github.com/IonicaBizau/learning-nodejs)—Learning how file uploads work in a NodeJS server.
 - [`learning-nodejs-file-upload`](https://github.com/IonicaBizau/learning-nodejs)—Learning how file uploads work in a NodeJS server.
 - [`test-youtube-api`](https://github.com/IonicaBizau/test-youtube-api)—Test Youtube API NodeJS module
 - [`web-term`](https://github.com/IonicaBizau/web-term)—A full screen terminal in your browser.
 - [`wrabbit`](https://github.com/jillix/wrabbit) (by jillix)—Wrap scripts by providing the wrapping function.
 - [`youtube-album-uploader`](https://github.com/jpchip/youtube-album-uploader) (by Jared Chapiewsky)—Uploads an mp3 album to Youtube

## :scroll: License

[MIT][license] © [Ionică Bizău][website]

[badge_patreon]: http://ionicabizau.github.io/badges/patreon.svg
[badge_amazon]: http://ionicabizau.github.io/badges/amazon.svg
[badge_paypal]: http://ionicabizau.github.io/badges/paypal.svg
[badge_paypal_donate]: http://ionicabizau.github.io/badges/paypal_donate.svg
[patreon]: https://www.patreon.com/ionicabizau
[amazon]: http://amzn.eu/hRo9sIZ
[paypal-donations]: https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=RVXDDLKKLQRJW
[donate-now]: http://i.imgur.com/6cMbHOC.png

[license]: http://showalicense.com/?fullname=Ionic%C4%83%20Biz%C4%83u%20%3Cbizauionica%40gmail.com%3E%20(https%3A%2F%2Fionicabizau.net%2F)&year=2014#license-mit
[website]: https://ionicabizau.net/
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
