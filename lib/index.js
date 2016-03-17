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
    ;

/**
 * LienCreator
 * Creates the `lien` object.
 *
 * @name LienCreator
 * @function
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 * @return {Lien} The lien object.
 */
class LienObj {
    constructor (req, res, server) {
        this.req = req;
        this.res = res;
        this.host = req.hostname;
        this.params = req.params;
        this.query = req.query;
        this.pathname = req.path;
        this.method = req.method.toLowerCase();
        this.cookies = req.cookies || {};
        this.redirect = res.redirect.bind(res);
        this.server = server;
        this.data = req.body;
        this.session = req.session;
    }

    startSession (data) {
        this.setSessionData(data);

    }

    setSessionData (data) {
        this.session._sessionData = data;
    }

    getSessionData (field) {
        if (field) {
            return findValue(this.session._sessionData, field);
        }
        return this.session._sessionData;
    }

    destroySession () {
        this.session.destroy();
    }

    header (name, value) {
        if (value === undefined && typeof name === "string") {
            return this.req.header(name);
        }
        return this.res.set(name, value);
    }

    apiError (msg, status) {
        status = status || 422;
        this.end({ message: msg }, status);
    }

    /**
     * end
     * Ends the response sending the content.
     *
     * @name end
     * @function
     * @param {Anything} content The content that should be sent to the response.
     * @param {Number} status The status code.
     * @param {String} contentType The content or mime type.
     * @param {Object} headers Additional headers to send in the response.
     * @return {undefined}
     */
    end (content, status, contentType, headers) {

        if (typeof contentType === "object") {
            headers = contentType;
            contentType = null;
        }

        if (typeof content === "number") {
            status = content;
            content = "";
        }

        let bRes = toBuffer(content);

        this.res.status(status || 200);
        if (headers) {
            this.header(headers);
        }

        contentType = contentType || bRes.contentType;
        this.res.type(contentType)
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
        filePath = path.join(customRoot, filePath);
        this.res.sendFile(filePath);
    }
}

/**
 * Lien
 * Creates a new Lien instance.
 *
 * @name Lien
 * @function
 * @param {Object} opt_options An object containing the following properties:
 *
 *  - `host` (String): The server host.
 *  - `port` (Integer): The server port.
 *  - `root` (String): The public directory (default: `__dirname + "/public"`).
 *  - `cache` (Integer): The number of seconds for keeping the files in cache (default: `300`).
 *  - `ssl` (Object): An object containing the following fields:
 *      - `key` (String): The path to the key file.
 *      - `cert` (String): The path to the cert file.
 *      - `_key` (String|Buffer): The key file content (defaults to the key file content).
 *      - `_cert` (String|Buffer): The cert file content (defaults to the cert file content).
 *
 * @return {Object} The Lien instance.
 */
module.exports = class Lien extends EventEmitter {
    constructor (options) {

        super();

        options = ul.merge(options, {
            public: []
          , session: false
          , errorPages: {}
        });


        this.express = express;
        this.router = express.Router();

        let app = this.app = express();

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        this.MongoStore = connectMongo(session);


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

            this.app.use(
                session(options.session)
            );
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

        this.app.use(this.router);

        // Public directories
        options.public.forEach(c => {
            this.app.use(c[0], express.static(c[1]));
        });

        // Start listening on host:port
        this.server.listen(options.port, options.host, err => {
            this.emit("load", err);
        });

        if (options.errorPages) {
            process.nextTick(() => {
                this.errorPages(options.errorPages);
            });
        }
    }

    _handleRoute (req, res, output, args) {
        let lien = new LienObj(req, res, this);
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

    addPage (url, method, output) {
        if (output === undefined) {
            output = method;
            method = "get";
        }
        this.router[method](url, (req, res) => {
            this._handleRoute(req, res, output);
        });
    }
    errorPages (options) {
        options = ul.merge(options, {
            notFound: lien => {
                // respond with json
                if (lien.req.accepts("html")) {
                    return lien.end("Not found.", 404);
                } else if (lien.req.accepts("json")) {
                    lien.end({ error: "Not found" }, 404);
                    return;
                }

                // default to plain-text. send()
                lien.end("Not found", 404, "txt");
            }
          , serverError: lien => {
              lien.end('500 — Internal Server Error', 500);
            }
        });
        this.router.use((req, res, next) =>
            this._handleRoute(req, res, options.notFound)
        );
        this.router.use((err, req, res, next) => {
            this.emit("serverError", err);
            this._handleRoute(req, res, options.serverError, [err])
        });
    }
};
