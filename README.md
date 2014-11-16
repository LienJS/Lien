![Lien](https://raw.githubusercontent.com/LienJS/Resources/master/logo/header.png)

Another lightweight NodeJS framework. *Lien* is the link between request and response objects.

# Example

Directory structure:

```sh
$ tree
.
├── index.js
└── public
    └── index.html

1 directory, 2 files
```

Main file (`index.js`)

```js
// Dependencies
var Lien = require("../lib/index");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
});

// Add page
server.page.add("/", function (lien) {
    lien.file("/index.html");
});
```

# Documentation

## `Lien(opt_options)`
Creates a new Lien instance.

### Params
- **Object** `opt_options`: An object containing the following properties:
 - `host` (String): The server host.
 - `port` (Integer): The server port.
 - `root` (String): The public directory (default: `__dirname + "/public"`).
 - `cache` (Integer): The number of seconds for keeping the files in cache (default: `300`).

### Return
- **Object** The Lien instance.

## `page`
Page is a property containing the `add` and `delete` methods documented below.

## `add(route, method, callback)`
Adds a new page route to the Lien instance.

### Params
- **String|RegExp** `route`: A String or RegExp value that will handle pathnames.
- **String** `method`: The HTTP method. If provided, the callback will be handled only for that type of HTTP method.
- **Function** `callback`: The route handler. It will be called with `lien` object.

## `delete(route, method)`
Deletes a page route.

### Params
- **String** `route`: Route that should be deleted.
- **String** `method`: The HTTP method.

## `Session(lien)`
Attaches the sesssion handlers.

### Params
- **Lien** `lien`: The lien object.

### Return
- **Object** The session handlers.

## `start(data)`
Starts a new session.

### Params
- **Object** `data`: The session data.

## `destroy()`
Destroys the session.

## `getData()`
Returns the object data.

### Return
- **Object** The object data.


## `LienCreator(req, res)`
Creates the `lien` object.

### Params
- **Object** `req`: The request object.
- **Object** `res`: The response object.

### Return
- **Lien** The lien object.

## `file(path, customRoot)`
Serves a file to the response.

### Params
- **String** `path`: Relative path to the file.
- **String** `customRoot`: Absolute path to the root directory (optional).

## `cookies()`
Returns the cookies from request object.

### Return
- **Object** An object containing cookie keys and values.

## `cookie(cookie, value)`
Sets, gets or deletes the cookie.

### Params
- **String** `cookie`: The searched cookie.
- **String** `value`: If provided and it not `null`, the cookie will be set. If it's null, the cookie will be deleted. If `value` is not provided, the cookie value will be returned.

### Return
- **String|null|undefined** `null`, if the cookie was deleted. `undefined` if the cookie doesn't exist. The cookie value if this exists.

## `end(content, status)`
Ends the response sending the content.

### Params
- **Anything** `content`: The content that should be sent to the response.
- **Number** `status`: The status code.

## `redirect(url)`
Redirects the response to the `url` parameter.

### Params
- **String** `url`: The redirect url.

## `ToBuffer(data)`
Converts data to buffer.

### Params
- **Anything** `data`: The value that will be converted to buffer.

### Return
- **Object** An object containing the `headers` and `buffer` fields.

## `createDataObj(buffer, headers)`

### Params
- **Buffer** `buffer`: The buffer value.
- **Object** `headers`: The response headers.

### Return
- **Object** An object containing the `headers` and `buffer` fields.

## How to contribute

1. File an issue in the repository, using the bug tracker, describing the
   contribution you'd like to make. This will help us to get you started on the
   right foot.
2. Fork the project in your account and create a new branch:
   `your-great-feature`.
3. Commit your changes in that branch.
4. Open a pull request, and reference the initial issue in the pull request
   message.

## License
See the [LICENSE](./LICENSE) file.
