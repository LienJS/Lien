// Dependencies
var Statique = require("statique")
  , Events = require("events")
  , EventEmitter = Events.EventEmitter
  , Http = require("http")
  , Url = require("url")
  , QueryString = require("querystring")
  , LienCreator = require("./creator")
  , Utils = require("jxutils")
  , Path = require("path")
  , SetOrGet = require("set-or-get")
  , IterateObject = require("iterate-object")
  ;

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
 *
 * @return {Object} The Lien instance.
 */
var Lien = module.exports = function (opt_options) {

    // Create a new instance of event emitter
    var self = new EventEmitter();
    self.routes = {};

    // Create the Statique server
    self._sServer = new Statique({
        root: opt_options.root || Path.resolve() + "/public"
      , cache: opt_options.cache
    }).setRoutes(self.routes);

    // Create HTTP server
    self._server = Http.createServer(function (request, response) {
        if (self.onrequest.run(request.url, LienCreator.call(self, request, response))) {
            return;
        };
        self._sServer.serve(request, response);
    });

    // Start listening on host:port
    self._server.listen(opt_options.port, opt_options.host, function (err) {
        self.emit("load", err);
    });

    self.onrequest = {};
    self.onrequest._ = {};

    /**
     * add
     * Adds a new custom handler for specified url.
     *
     * @name add
     * @function
     * @param {String} url The url to listen to.
     * @param {Function} fn The custom handler.
     */
    self.onrequest.add = function (url, fn) {
        SetOrGet(this._, url, []).push(fn);
    };

    /**
     * exists
     * Checks if there are any url handlers.
     *
     * @name exists
     * @function
     * @param {String} url The url to listen to.
     * @return {Array|Undefined} The array of handlers or `undefined` if there is no event.
     */
    self.onrequest.exists = function (url) {
        return this._[url];
    };

    /**
     * run
     * Executes the custom handlers.
     *
     * @name run
     * @function
     * @param {String} url The url to listen to.
     * @param {Lien} lien The lien object.
     * @return {Boolean} `true` if any of the request prevented the response, `false` otherwise.
     */
    self.onrequest.run = function (url, lien) {
        var evs = this.exists(url)
          , prevent = false
          ;

        if (!evs || !evs.length) {
            return;
        }

        IterateObject(evs, function (c) {
            var rValue = c(lien);
            if (rValue === false) {
                prevent = true;
            } else if (rValue === null) {
                return false;
            }
        });

        return prevent;
    };

    /*!
     * Methods
     * */
    self.page = {};

    /**
     * add
     * Adds a new page route to the Lien instance.
     *
     * @name add
     * @function
     * @param {String|RegExp} route A String or RegExp value that will handle pathnames.
     * @param {String} method The HTTP method. If provided, the callback will be handled only for that type of HTTP method.
     * @param {Function} callback The route handler. It will be called with `lien` object.
     * @return {undefined}
     */
    self.page.add = function (route, file, method, callback) {

        var sRoute = {};

        // add("/foo", "path/to/file.html", "get")
        // add("/foo", "path/to/file.html")
        if ((typeof route === "string" || route.constructor === RegExp)  && typeof file === "string" && typeof method !== "function") {
            var meth = {};
            if (typeof method === "string") {
                meth[method] = file;
            } else {
                meth = file;
            }
            self._sServer.addRoute(meth, route);
            return;
        }

        // add("/foo", "get", callback);
        // add("/foo", callback);
        if (typeof method === "function") {
            callback = method;
            method = file;
            file = null;
        } else if (typeof file === "function") {
            callback = file;
            method = null;
            file = null;
        }

        callback = callback || function () {};
        if (method) {
            sRoute = {};
            sRoute[method] = generateCallback();
            self._sServer.addRoute(sRoute, route);
        } else {
            self._sServer.addRoute(generateCallback(), route);
        }

        function generateCallback() {
            return function (req, res, form) {
                var lien = LienCreator.call(self, req, res);
                if (req.method.toLowerCase() === "post" && !/multipart/.test(req.headers["content-type"])) {
                    return form.on("done", function (form) {
                        if (form.error) {
                            return lien.end(form.error, 500);
                        }
                        if (form.data) {
                            try {
                                form.data = JSON.parse(form.data);
                            } catch (e) {
                                form.data = QueryString.parse(form.data);
                            }
                        }

                        if (form.data && form.data.constructor === Object) {
                            lien.data = Utils.unflattenObject(form.data);
                        }
                        callback.call(self, lien);
                    });
                }
                callback.call(self, lien);
            }
        }
    };

    /**
     * delete
     * Deletes a page route.
     *
     * @name delete
     * @function
     * @param {String} route Route that should be deleted.
     * @param {String} method The HTTP method.
     * @return {undefined}
     */
    self.page.delete = function (route, method) {
        if (arguments.length < 2) {
            if (self.routes[route]) {
                delete self.routes[route];
            }
        } else {
            if (self.routes[route] && self.routes[route][method]) {
                delete self.routes[route][method];
            }
        }
    };

    return self;
};
