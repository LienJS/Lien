"use strict";

const events = require("events")
    , EventEmitter = events.EventEmitter
    , express = require("express")
    , bodyParser = require("body-parser")
    , ul = require("ul")
    , http = require("http")
    , https = require("https")
    , fs = require("fs")
    , path = require("path")
    , toBuffer = require("./to-buffer")
    , session = require("express-session")
    , findValue = require("find-value")
    , connectMongo = require("connect-mongo")
    , qs = require("querystring")
    , parseUrl = require("parse-url")
    , Transformer = require("transformer")
    , setOrGet = require("set-or-get")
    , httpMethods = require("methods")
    , pathToRegexp = require("path-to-regexp")
    , iterateObject = require("iterate-object")
    , noop = require("noop6")
    , cookieParser = require("cookie-parser")
    , csrf = require("csurf")
    ;

class LienObj {

    /**
     * LienCreator
     * Creates the `lien` object.
     *
     * @name LienCreator
     * @function
     * @param {Object} req The request object.
     * @param {Object} res The response object.
     * @param {Function} next The `next` middleware function.
     * @param {Object} server The `Lien` server instance.
     * @return {Lien} The lien object.
     */
    constructor (req, res, next, server) {
        this._next = next;
        this.req = req;
        this.res = res;

        this.url = parseUrl(req.originalUrl);
        this.path = this.req.path

        if (this.path.charAt(this.path.length - 1) === "/") {
            this.path = this.path.slice(0, -1) || "/";
        }

        this.host = req.hostname;
        this.params = req.params;
        this.query = req.query;
        this.pathname = this.url.pathname;
        this.method = req.method.toLowerCase();
        this.cookies = req.cookies || {};
        this.server = server;
        this.data = req.body;
        this.session = req.session;
        Object.defineProperty(this, "csrfToken", {
            get: () => (this.req.csrfToken && this.req.csrfToken()) || ""
        });
        Object.defineProperty(this, "csrfInput", {
            get: () => this.req.csrfToken ? `<input type="hidden" name="_csrf" value="${this.req.csrfToken()}">` : ""
        });

        this.full_path = req.originalUrl;
        this.protocol = req.protocol;
        this.domain = `${this.protocol}://${this.host}`;
        this.href = `${this.domain}${req.originalUrl}`;
    }

    /**
     * next
     * Go to the next middleware handler.
     *
     * @name next
     * @function
     * @returns {Lien} The `Lien` instance.
     */
    next (err, data) {
        this._next(err, data);
        return this;
    }

    /**
     * redirect
     * Redirects the client to another url.
     *
     * @name redirect
     * @function
     * @param {String} newUrl The new url to redirect to.
     * @param {Boolean|Object} query If `true`, the request querystring parameters will be appended. If it's an object, it will be merged with the request querystring parameters.
     */
    redirect (newUrl, query) {
        if (query) {
            let sQuery = null;
            sQuery = qs.stringify(
                query === true
              ? this.query
              : ul.merge(query, this.query)
            );
            sQuery && (newUrl += "?" + sQuery);
        }
        this.res.redirect(newUrl);
    }

    /**
     * render
     * Renders a template to the client.
     *
     * @name render
     * @function
     * @param {String} template The template name.
     * @param {Object} data The template data.
     */
    render (template, data) {
        this.res.render(template, data);
    }

    /*!
     * _checkSessionSupport
     * Checks if the session is supported or not.
     *
     * @name _checkSessionSupport
     * @function
     * @returns {Boolean} `false` if session is *not* supported. `true` otherwise.
     */
    _checkSessionSupport () {
        if (this.session) {
            return true;
        }
        console.warn("You're trying to use a session feature, but you didn't enable the session support.");
        return false;
    }

    /**
     * startSession
     * Starts a session.
     *
     * @name startSession
     * @function
     * @param {Object} data The session data.
     */
    startSession (data) {
        if (!this._checkSessionSupport()) { return; }
        this.setSessionData(data);
    }

    /**
     * setSessionData
     * Sets the session data.
     *
     * @name setSessionData
     * @function
     * @param {Object} data The session data.
     */
    setSessionData (data) {
        if (!this._checkSessionSupport()) { return; }
        this.session._sessionData = ul.deepMerge(data, this.getSessionData());
    }

    /**
     * getSessionData
     * Returns the session data object/specific field.
     *
     * @name getSessionData
     * @function
     * @param {Field} field A specific field to get from the session object.
     * @returns {Value|Object} The field value. If a field is not specified,
     * the whole session data object is returned.
     */
    getSessionData (field) {
        if (!this._checkSessionSupport()) { return; }
        if (field) {
            return findValue(this.session._sessionData, field) || null;
        }
        return this.session._sessionData;
    }

    /**
     * destroySession
     * Destroys the session.
     *
     * @name destroySession
     * @function
     */
    destroySession () {
        if (!this._checkSessionSupport()) { return; }
        this.session.destroy();
    }

    /**
     * header
     * Gets/sets/deletes headers.
     *
     * @name header
     * @function
     * @param {String} name The header name.
     * @param {String} value The header value to set. If `null`, the header will be *removed*.
     * @returns {Lien} The Lien instance.
     */
    header (name, value) {

        if (!name && !value) {
            return this.req.headers;
        }

        if (value === null) {
            return this.res.removeHeader(name);
        }

        if (value === undefined && typeof name === "string") {
            return this.req.header(name);
        }

        if (typeof name === "object") {
            iterateObject(name, (value, name) => this.header(name, value));
            return this;
        }

        this.res.set(name, value);
        return this;
    }

    /**
     * apiMsg
     * Sends to the client a JSON object containing the `message` field.
     *
     * @name apiMsg
     * @function
     * @param {String} msg The API message.
     * @param {Number} status The status code (default: `200`).
     */
    apiMsg (msg, status) {
        status = status || 200;
        this.end({ message: msg }, status);
    }

    /**
     * apiError
     * Like `apiMsg`, but by default with a status code of `422`.
     *
     * @name apiError
     * @function
     * @param {String} msg The API message.
     * @param {Number} status The status code (default: `422`).
     */
    apiError (msg, status) {
        msg = msg.message || msg;
        this.apiMsg(msg, status || 422)
    }

    /**
     * end
     * Ends the response sending the content.
     *
     * @name end
     * @function
     * @param {Anything} content The content that should be sent to the response.
     * @param {Number} status The status code.
     * @param {String} contentType The content type (e.g. `"json"`).
     * @param {Object} headers Additional headers to send in the response.
     */
    end (content, status, contentType, headers) {

        let resData = {};

        // end(content, status, headers)
        if (typeof contentType === "object") {
            headers = contentType;
            contentType = null;
        }

        // end(status, headers)
        if (typeof content === "number") {
            status = content;
            content = "";
        }

        resData.content = content;
        resData.status = status || 200;
        resData.headers = headers || {};
        resData.contentType = contentType
        resData.lien = resData;

        let trans = this.server.getHooks("after", this.path, this.method);

        if (trans) {
            trans.start(resData, (err, data) => {
                if (err) {
                    data.content = err;
                }
                this._sendResponse(data);
            });
        } else {
            this._sendResponse(resData);
        }
    }

    /*!
     * _sendResponse
     * Low level function for sending the response.
     *
     * @name _sendResponse
     * @function
     * @param {Object} resData An object containing the following fields:
     *
     *  - `content` (Anything): The data to send to client.
     *  - `status` (Number): The response status.
     *  - `headers` (Object): The headers object.
     *  - `contentType` (String): The content type.
     *
     */
    _sendResponse (resData) {

        if (this.res.headersSent) {
            return;
        }

        if (resData.content && resData.content.statusCode) {
            resData.status = resData.content.statusCode;
        }

        let bRes = toBuffer(resData.content);

        this.res.status(resData.status);
        this.header(resData.headers);

        this.res.type(resData.contentType || bRes.contentType);
        this.res.end(bRes.buffer);
    }

    /**
     * cookie
     * Sets, gets or deletes the cookie.
     *
     * @name cookie
     * @function
     * @param {String} cookie The searched cookie.
     * @param {String} value If provided and it not `null`, the cookie will be set. If it's null, the cookie will be deleted. If `value` is not provided, the cookie value will be returned.
     * @return {String|null|undefined} `null`, if the cookie was deleted. `undefined` if the cookie doesn't exist. The cookie value if this exists.
     */
    cookie (name, value, options) {
        if (value === undefined) {
            return this.cookies[name];
        }

        if (value === null) {
            this.res.clearCookie(name);
        } else {
            this.res.cookie(name, value, options);
        }

        return this;
    }

    /**
     * file
     * Serves a file to the response.
     *
     * @name file
     * @function
     * @param {String} path Relative path to the file.
     * @param {String} customRoot Absolute path to the root directory (optional).
     */
    file (filePath, customRoot) {
        if (!customRoot) {
            customRoot = this.server.options.public[0][1];
        }
        filePath = path.resolve(customRoot, filePath);
        this.res.sendFile(filePath);
    }
}

/**
 * Lien
 * Creates a new Lien instance.
 *
 * It extends the `EventEmitter` class.
 *
 * It emits the following events:
 *
 *  - `load` (err): After the server is started. If there are no errors, the `err` will be null.
 *  - `serverError` (err, req, res): The server unexpected error.
 *
 * @name Lien
 * @function
 * @param {Object} opt_options An object containing the following properties:
 *
 *  - `host` (String): The server host.
 *  - `port` (Integer): The server port. `process.env.PORT` is used, default is `3000`.
 *  - `session` (Boolean|Object): Enable the session support. If it's an object, it will be merged with the following defaults and passed to [`express-session`](https://github.com/expressjs/session):
 *    - `secret` (String): This is the secret used to sign the session ID cookie (default: "lien server").
 *    - `resave` (Boolean): Forces the session to be saved back to the session store, even if the session was never modified during the request (default: false).
 *    - `saveUninitialized` (Boolean): Forces a session that is "uninitialized" to be saved to the store (default: `true`).
 *    - `cookie` (Object): The cookie [options](https://github.com/expressjs/cookie-parser).
 *    - `storeOptions` (Object): The [MongoStore options](https://github.com/kcbanner/connect-mongo).
 *    - `store`: (Object): A custom store object (optional, as long `storeOptions` is provided).
 *  - `public` (String|Array): The path to the public directory or an array of arrays in this format: `["/url/of/static/dir", "path/to/static/dir"]`.
 *
 *    Example:
 *
 *    ```js
 *    [
 *      ["/images", "path/to/images"]
 *    , ["/", "path/to/public"]
 *    ]
 *    ```
 *
 *  - `ssl` (Object): An object containing the following fields:
 *      - `key` (String): The path to the key file.
 *      - `cert` (String): The path to the cert file.
 *      - `_key` (String|Buffer): The key file content (defaults to the key file content).
 *      - `_cert` (String|Buffer): The cert file content (defaults to the cert file content).
 *
 *  - `views`
 *    - `path` (String): The path to the views directory.
 *    - `name` (String): The view engine name.
 *
 *  - `errorPages` (Object):
 *    - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
 *    - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.
 *    - `badCsrf` (String|Function):  The path to a custom bad CSRF page or a function receiving the lien object as parameter. This can be used to serve custom bad CSRF errors.
 *
 *  - `logErrors` (Boolean): Log the server errors (default: `true`).
 *  - `csrf` (Object): The CSRF options. These are passed to [`csurf`](https://github.com/expressjs/csurf)
 *
 * @return {Object} The Lien instance.
 */
class Lien extends EventEmitter {
    constructor (options) {

        super();

        options = ul.merge(options, {
            public: []
          , session: false
          , errorPages: {}
          , logErrors: true
          , csrf: null
          , port: process.env.PORT || 3000
        });

        if (options.csrf === true) {
            options.csrf = {
                cookie: true
            };
        }

        this.csrf = options.csrf ? csrf(options.csrf) : null;
        this.express = express;
        this.router = express.Router();
        this.beforeRequest = express.Router();

        this.transformers = {
            before: {}
          , after: {}
        };

        let app = this.app = express();

        if (options.views) {
            app.set("views", options.views.path);
            app.set("view engine", options.views.name);
        }

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        this.MongoStore = connectMongo(session);

        app.use(cookieParser());

        if (options.session) {
            options.session = ul.merge(options.session, {
                secret: "lien server"
              , resave: false
              , saveUninitialized: true
              , cookie: {}
              , store: null
              , storeOptions: {}
            });

            if (!options.session.store && options.session.storeOptions) {
                options.session.store = new this.MongoStore(options.session.storeOptions);
            }

            delete options.storeOptions;

            this.session = session(options.session);
            this.app.use(this.session);
        }

        // Handle ssl
        if (options.ssl) {
            options.ssl._key = options.ssl._key || fs.readFileSync(options.ssl.key);
            options.ssl._cert = options.ssl._cert || fs.readFileSync(options.ssl.cert);
            this.server = https.createServer({
                key: options.ssl._key
              , cert: options.ssl._cert
            }, this.app);
        } else {
            this.server = http.createServer(this.app);
        }

        if (!Array.isArray(options.public)) {
            options.public = [["/", options.public]];
        }

        this.options = options;

        app.use(this.beforeRequest);
        app.use(this.router);

        // Public directorie
        options.public.forEach(c => {
            this.addStaticPath(c[0], c[1]);
        });

        const listenArgs = [options.port];

        if (options.host) {
            listenArgs.push(options.host);
        }

        listenArgs.push(err => {
            this.emit("load", err);
        });

        // Start listening on host:port
        this.server.listen.apply(this.server, listenArgs);

        if (options.errorPages) {
            process.nextTick(() => {
                this.errorPages(options.errorPages);
            });
        }
    }

    addStaticPath (url, localPath) {
        this.app.use(url, express.static(localPath));
    }

    /*!
     * _handleRoute
     * Calls a function or serves a static file.
     *
     * @name _handleRoute
     * @function
     * @param {Request} req The request object.
     * @param {Response} res The response object.
     * @param {String|Function} output The path to a public file or a function.
     * @param {Array} args An array of custom arguments to be used in the function call.
     */
    _handleRoute (req, res, output, args, next) {
        let lien = new LienObj(req, res, next || noop, this);

        if (typeof output === "string") {
            return lien.file(output);
        }

        if (Array.isArray(args)) {
            args.unshift(lien);
        } else {
            args = [lien];
        }

        output.apply(this, args);
    }

    /*!
     * _handleLienRoute
     *
     * @name _handleLienRoute
     * @function
     * @param {Lien} lien The Lien instance.
     * @param {Function} output The route handler.
     */
    _handleLienRoute (lien, output) {
        if (typeof output === "string") {
            return lien.file(output);
        }
        output.apply(this, [lien]);
    }

    /**
     * addPage
     * Adds a new page to be handled.
     *
     * @name addPage
     * @function
     * @param {String} url The page url.
     * @param {String|Object} method The request methods to be handled (default: `"all"`) or an object:
     *
     *  - `method` (String): The HTTP method.
     *  - `before` (Array|Function): A function or an array of middleware functions to be executed *before* the main function.
     *  - `after` (Array|Function): A function or an array of middleware functions to be executed *after* the main function.
     *
     * @param {Function} output A function receiving the `lien` object as parameter. If can be a path serving a public file.
     */
    addPage (url, method, output) {

        if (output === undefined) {
            output = method;
            method = "all";
        }

        let router = typeof url === "string" && ~url.indexOf(":") ? this.router : this.beforeRequest;
        let before = [this.csrf]
        let after = []
        if (method && method.method) {
            before = method.before || [];
            if (!Array.isArray(before)) {
                before = [before];
            }
            after = method.after || [];
            if (!Array.isArray(after)) {
                after = [after];
            }
            method = method.method;
        }
        let funcs = [].concat(before);
        funcs.push((req, res, next) => {
            let trans = this.getHooks("before", req.path, req.method.toLowerCase());
            if (trans) {
                let lien = new LienObj(req, res, next, this);
                trans.start(lien, (err, data) => {
                    if (err) { return lien.end(err); }
                    this._handleLienRoute(lien, output);
                });
            } else {
                this._handleRoute(req, res, output, [], next);
            }
        });
        funcs = funcs.concat(after);

        router[method].apply(router, [url].concat(funcs.filter(Boolean)));
    }

    /**
     * errorPages
     * Handle the error pages.
     *
     * @name errorPages
     * @function
     * @param {Object} options An object containing the following fields:
     *
     *  - `notFound` (String|Function): The path to a custom 404 page or a function receiving the lien object as parameter. This can be used to serve custom 404 pages.
     *  - `serverError` (String|Function): The path to a custom 500 page or a function receiving the lien object as parameter. This can be used to serve custom 500 pages.
     */
    errorPages (options) {
        let sendResp = (lien, msg, status) => {
            if (lien.req.accepts("html")) {
                return lien.end(msg, status);
            } else if (lien.req.accepts("json")) {
                return lien.apiError(msg, status);
            }
            lien.end(msg, status, "txt");
        };
        options = ul.merge(options, {
            notFound: lien => sendResp(lien, "404 — Not found.", 404)
          , serverError: lien => sendResp(lien, "500 — Internal Server Error", 500)
          , badCsrf: lien => sendResp(lien, "What‽ Your browser did something unexpected.", 422)
        });
        this.app.use((req, res, next) => {
            this._handleRoute(req, res, options.notFound, [], next)
        });
        this.app.use((err, req, res, next) => {
            if (err.code === "ENOENT" || err.statusCode === 404) {
                return this._handleRoute(req, res, options.notFound, [err], next)
            }
            if (err.code === "EBADCSRFTOKEN") {
                return this._handleRoute(req, res, options.badCsrf, [err], next)
            }

            this.emit("serverError", err, req, res);
            if (this.options.logErrors) {
                console.error(err.stack);
            }
            this._handleRoute(req, res, options.serverError, [err], next)
        });
    }

    /**
     * getHooks
     * Gets the transformer for a url.
     *
     * @name getHooks
     * @function
     * @param {String} type The hook type (`before` or `after`).
     * @param {String} url The url.
     * @param {String} method The method.
     * @returns {Transformer|null} The transformer (if it exists) or `null`.
     */
    getHooks (type, url, method) {
        let typ = this.transformers[type] = this.transformers[type] || {}
          , all = setOrGet(typ, method, [])
          , hooks = []
          ;

        for (let i = 0, c; i < all.length; ++i) {
            c = all[i];
            if (c.re.test(url)) {
                hooks.push(c.trans);
            }
        }

        if (hooks.length) {
            if (hooks.length === 1) {
                return hooks[0];
            }
            return new Transformer({}, { autostart: false }).add(hooks, Transformer.PARALLEL);
        }

        return null;
    }

    /**
     * getHooksStrict
     * Similar to `getHooks`, but doesn't concat hooks based on the regex
     * matching but only if they are the same regex.
     *
     * @name getHooksStrict
     * @function
     * @param {String} type The hook type (`before` or `after`).
     * @param {String} url The url.
     * @param {String} method The method.
     * @returns {Transformer|null} The transformer (if it exists) or `null`.
     */
    getHooksStrict (type, url, method) {
        let reUrl = pathToRegexp(url)
          , typ = this.transformers[type] = this.transformers[type] || {}
          , all = setOrGet(typ, method, [])
          , hooks = []
          ;

        for (let i = 0, c; i < all.length; ++i) {
            c = all[i];
            if (c.re.toString() === reUrl.toString()) {
                hooks.push(c.trans);
            }
        }

        if (hooks.length) {
            if (hooks.length === 1) {
                return hooks[0];
            }
            return new Transformer({}, { autostart: false }).add(hooks, Transformer.PARALLEL);
        }

        return null;
    }

    /**
     * insertHook
     * Inserts a new hook.
     *
     * @name insertHook
     * @function
     * @param {String} type The hook type (`before`, `after`, `custom:name`).
     * @param {String} url The url.
     * @param {String} method The method.
     * @param {Transformer} trans The transformer to insert.
     * @returns {Transformer} The inserted transformer.
     */
    insertHook (type, url, method, trans) {
        let all = setOrGet(this.transformers[type], method, []);

        all.push({
            re: pathToRegexp(url)
          , trans: trans
        });

        return trans;
    }

    /**
     * hook
     * Adds a new hook.
     *
     * @name hook
     * @function
     * @param {String} where The hook type (`before` or `after`).
     * @param {String} url The route url.
     * @param {String} method The HTTP method.
     * @param {Function} cb The callback function.
     * @param {Number} transType The transformer type.
     */
    hook (where, url, method, cb, transType) {

        if (typeof url === "string" && url.charAt(0) === ":") {
            url = `/${url}`;
        }
        if (typeof method === "function") {
            cb = method;
            method = "all";
        }

        if (method === "all") {
            httpMethods.forEach(c => this.hook(where, url, c, cb, transType));
            return this;
        }

        let customName = where.split(":");

        let trans = {};
        setOrGet(this.transformers, where, {})
        switch (customName[0]) {
            case "before":
            case "after":
            case "custom":
                trans = this.getHooksStrict(where, url, method) || this.insertHook(where, url, method, new Transformer({}, { autostart: false }));
                break;
            default:
                throw new Error("The hook type should be 'before', 'after' or 'custom'.");
                break;
        }

        trans.add(cb, transType);
        return this;
    }
}

Lien.LienObj = LienObj;
module.exports = Lien;
