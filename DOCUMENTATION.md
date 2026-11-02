# Lien API

Lien requires **Node.js 22.12 or newer**. Its implementation, examples, and tests
use ES modules. The package exports the default `Lien` constructor and named
`Lien`, `LienObj`, and `Hooks` exports:

```js
import Lien, { Hooks } from "lien";
const server = new Lien({
    port: 9000,
    public: `${import.meta.dirname}/public`
});
server.before("/posts/:id", async lien => {
    lien.post = await findPost(lien.params.id);
});
server.get("/posts/:id", lien => lien.end(lien.post));
server.after("/posts/:id", async response => {
    response.headers["x-example"] = "yes";
});
await server.ready;
// Later: await server.close();
```

On supported Node versions, `const Lien = require('lien')` still returns the same
constructor through Node's native ESM interop. There is no separate CommonJS build.
Relative ES module imports must include a filename, for example
`import Lien from './lib/index.js'`.

## Server and lifecycle

`new Lien(options)` still starts listening automatically and extends
`EventEmitter`. Register routes immediately after construction, then await
`server.ready` or subscribe to `load`.

| Member | Behavior |
| --- | --- |
| `ready` | Promise resolving to the server after it starts, or rejecting on initialization/listen errors. |
| `close()` | Awaitable, idempotent shutdown; closes stores created by Lien, and leaves supplied store instances to their owner. |
| `load(error)` event | Emitted with `null` on success or the startup error on failure. |
| `error(error)` event | Startup errors are also emitted here when a listener is registered. |
| `serverError(error, req, res)` event | Request errors; underlying server errors may omit `req` and `res`. |
| `app`, `router`, `beforeRequest`, `staticRouter` | The Express application and routers. |
| `server` | The underlying Node HTTP/HTTPS server. |
| `options` | Effective configuration; `port` contains the actual bound port, including when initialized with `0`. |

### Options

| Option | Default / meaning |
| --- | --- |
| `host`, `port` | Listen address; port defaults to `process.env.PORT` or `3000`. Port `0` chooses an available port. |
| `public` | A directory string or `[[url, directory], ...]`; defaults to `[]`. |
| `views` | `{ path, name }`, passed to Express's views and view-engine settings. Install or register your chosen engine. |
| `session` | `false`, `true`, or an express-session options object. |
| `cookieSecret` | Random 32-byte secret per server. Set a stable secret for deployments sharing signed cookies or sessions. |
| `cookieOptions` | Options passed to cookie-parser. |
| `csrf` | `null`, `true` (cookie mode), or options for [`@dr.pogodin/csurf`](https://github.com/birdofpreyru/csurf). |
| `bodyParserJson` | `true`, `false`, or options for `express.json()`. |
| `bodyParserUrlEncoded` | `true`, `false`, or options for `express.urlencoded()`; `extended: true` by default. |
| `cookieParser` | Whether to enable cookie-parser; defaults to `true`. |
| `transformers` | Legacy option name controlling both before and after hooks; defaults to `true`. |
| `logErrors` | Whether to log request errors; defaults to `true`. |
| `errorPages` | `{ notFound, serverError, badCsrf }`, each a filename or a handler receiving `(lien, error)`. Defaults to built-in pages. Set `false` to configure error handling yourself. |
| `ssl` | `{ key, cert }` certificate filenames, or `{ _key, _cert }` containing their contents. |

JSON and form parsing use Express's built-in middleware. CSRF validation remains
in place when route-specific middleware is configured. `csrf: true` requires
cookie parsing; session-mode CSRF requires sessions.

## Routes

- `addPage(url, output)` handles all methods.
- `addPage(url, method, output)` accepts an HTTP method name.
- `get(url, output)`, `post(url, output)`, `all(url, output)`, and other HTTP-method
  shortcuts retain the same signatures.
- `output` is a function receiving `lien`, or a filename relative to the public root.
  Async handlers and returned promises are supported; failures enter error handling.
- `addPage(url, { method, before, after }, output)` accepts Express middleware
  functions or arrays receiving `(req, res, next)`. These are distinct from Lien hooks.
- `add(url, [method], callback)` adds a route without executing before hooks.
  Responses sent with `lien.end()` still execute after hooks, matching prior behavior.
- `addStaticPath(url, localPath)` adds a public static mount.
- `errorPages(options)` appends custom fallback/error middleware. To replace all
  defaults explicitly, construct with `errorPages: false` and call it after setup.

The compatibility matcher preserves existing named parameters, optional/repeated
parameters, regex constraints, URL arrays, and RegExp routes. `'*'` matches every
path. Lien retains fixed-route priority ahead of static serving, with dynamic
routes following static serving. Express 5's own `app`/router APIs use its new
[route syntax](https://expressjs.com/en/guide/migrating-5/#path-syntax); the
compatibility layer applies to Lien's routing methods.

## Request and response helpers

`LienObj(req, res, next, server)` is available as `Lien.LienObj` and as a named
export. Every request receives its own instance.

| Member | Behavior |
| --- | --- |
| `req`, `res`, `server` | Underlying Express request/response and Lien server. |
| `path`, `pathname`, `full_path` | Normalized request path, mounted pathname, and original URL with query. |
| `host`, `protocol`, `domain`, `href` | Request hostname, protocol, origin including port, and full URL. |
| `method`, `params`, `query`, `data` | Lowercase method, decoded route parameters, query parameters, and parsed body. |
| `cookies`, `session` | Parsed cookies and the express-session object. |
| `csrfToken`, `csrfInput` | Token and hidden form input, or empty strings when CSRF is disabled. |
| `accepts(...types)` | Express content negotiation. |
| `next(error, data)` | Delegates to Express once and stops further hook execution. Returns the Lien object. |
| `header(name, value)` | Reads a request header with one string argument; sets a response header with two arguments; `null` removes it. An object sets multiple headers, and no arguments returns request headers. |
| `cookie(name, value, options)` | Reads, sets, or clears a cookie. Clearing with `null` forwards path/domain/etc. options. |
| `redirect(url, query)` | Sends a redirect. `true` merges request query parameters; an object overrides them. Existing target parameters and fragments are preserved. |
| `render(template, data)` | Awaitable template rendering. |
| `file(filename, customRoot)` | Awaitable file serving under the supplied root or first public directory. Leading slashes mean root-relative paths; traversal and escaping symlinks are denied. |
| `end(content, status, contentType, headers)` | Awaitable response with after hooks. Also supports `end(content, status, headers)` and `end(status, headers)`. |
| `apiMsg(message, status = 200)` | JSON `{ message }` through `end()`. |
| `apiError(message, status = 422)` | Like `apiMsg`; accepts a message or an Error's message. |
| `append`, `attachment`, `download`, `json`, `jsonp`, `links`, `vary`, `status` | Chainable Express response helpers with the same arguments. |

`end()` preserves a previously chosen status unless an explicit status overrides
it. Objects serialize as JSON; strings, Buffers, XML strings, and empty responses
remain supported. Error objects and serialization failures enter error handling
instead of returning stack traces or false success responses. Malformed/oversized
request bodies retain their HTTP 400/413 status.

After hooks apply to `end()` and helpers using it, including `apiMsg()` and
`apiError()`. Express-backed `render()`, `file()`, `redirect()`, `download()`,
`json()`, and `jsonp()` bypass after hooks as before.

## Hooks

Registration APIs remain unchanged:

```js
server.before(url, [method], callback, mode);
server.after(url, [method], callback, mode);
server.hook("before", url, [method], callback, mode);
server.use(url, [method], callback, mode);
```

Omitting the method applies to all methods. URL arrays and wildcards are
supported. `before()` and `after()` match the given pattern; `use()` also matches
subpaths. `use()` remains a route-hook helper and does not authenticate public
static files.

Before hooks receive `lien`. After hooks receive
`{ content, status, headers, contentType, lien }`. Mutate these objects in place;
return values do not replace them. Prefer async hooks:

```js
server.before("/account", async lien => {
    lien.user = await loadUser(lien);
    if (!lien.user) await lien.end("Unauthorized", 403);
});

// Existing callback hooks continue to work.
server.after("/account", (response, next) => {
    response.headers["x-account"] = "yes";
    next();
});
```

Hooks declaring zero or one argument complete when they return; promises are
awaited. Hooks declaring two or more arguments receive `(data, next)` and wait for
`next()` or a returned promise. The first completion wins. Thrown errors,
`next(error)`, and rejected promises enter error handling; error responses skip
failing after hooks. `next()` advances the hook chain, while `lien.next()`
delegates to Express. Ending the response or disconnecting the client stops
subsequent hooks; already running asynchronous work cannot be undone.

Every execution snapshots its definitions and owns its data and completion state.
A reusable pipeline never stores the previous request's data.

| Mode | Value | Behavior within a matching URL group |
| --- | --- | --- |
| `ORDERED` | `3` | Sequential; the default. |
| `UNORDERED` | `2` | Consecutive entries run together; later steps wait for them. |
| `PARALLEL` | `1` | A sequential prelude before the group's other entries, preserving the old implementation's actual behavior. |

Numbers and string names such as `'UNORDERED'` remain accepted. Constants are
available on `Lien.Hooks` and the named `Hooks` export. Matching URL groups run in
registration order.

### Low-level pipelines

- `getHooks(type, url, method)` returns a matching `Hooks` pipeline or `null`.
- `getHooksStrict(type, url, method)` matches the registered pattern itself.
- `insertHook(type, url, method, pipeline)` inserts and returns a native pipeline;
  `type` may also be `custom:name`.
- `pipeline.add(callbackOrPipeline, mode)` accepts a function, native pipeline, or
  array and returns the pipeline.
- `await pipeline.run(data, { signal, isStopped })` executes with optional cancellation.
- `pipeline.start(data, callback)` preserves `(error, data)` callback completion
  and returns a cancellation function. `start(callback)` uses a fresh empty object.
- Pipelines emit `end(error, data)` once per execution, including cancellation.

External Transformer instances must be rebuilt from their original callbacks
using `new Hooks()`. Arbitrary shared `.start()` objects, constructor data,
autostart, and private Transformer fields are not supported. Invalid modes and
cyclic composition throw `TypeError`.

## Sessions

`session: true` enables the default memory store. Session objects accept normal
[express-session options](https://github.com/expressjs/session#options), plus
`storeOptions` for stores created by Lien. Defaults are `resave: false` and
`saveUninitialized: true`. An explicit `session.secret` takes precedence over
`cookieSecret`; otherwise the server's cookie secret is used. Configure stable
secrets when sessions must survive restarts or span multiple instances.

`store` accepts an existing store, a provider with `create(options)`, a Store
subclass, a legacy `factory(expressSession)` returning a Store class, or an
installed module name. String providers load through dynamic `import()` before
listening. Native ES module providers and modern connect-mongo are supported.

- `startSession(data)` and `setSessionData(data)` merge application session data.
- `getSessionData()` returns that data; `getSessionData('nested.field')` returns a
  field or `null` when missing, preserving `false`, `0`, and empty strings.
- `await destroySession()` completes after the store removes the session.

The login example uses `connect-mongo@6`, `MongoStore.create({ mongoUrl })`, and
`SESSION_SECRET`/`MONGO_URL` environment variables. It requires a MongoDB server.
The TLS example requires certificate files under `example/ssl`.

## Development

```sh
npm ci
npm test
npm run test:coverage
```

Tests use only Node's native `node:test`, `node:assert`, and HTTP client, with
isolated servers, assigned ports, timeouts, and awaited teardown. The only
example/test dependency is connect-mongo; template rendering is checked with a
small registered fixture engine. The lockfile makes development installs
reproducible. CI covers Node 22.12, 24, and 26.

Runtime dependencies are Express 5, express-session, cookie-parser, the maintained
CSRF fork, and path-to-regexp 6.3. The latter preserves Lien's existing route
pattern syntax while Express uses its current matcher internally. Utilities,
body parsing, serialization, hook execution, and tests no longer require the
previous helper packages.
