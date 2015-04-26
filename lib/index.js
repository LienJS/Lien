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
        if (self._sServer.exists(request, response)) {
            self._sServer.serve(request, response);
        } else {
            self.emit("request", LienCreator.call(self, req, res));
        }
    });

    // Start listening on host:port
    self._server.listen(opt_options.port, opt_options.host, function (err) {
        self.emit("load", err);
    });

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
    self.page.add = function (route, method, callback) {

        var sRoute = {};

        if (typeof method === "function") {
            callback = method;
            method = undefined;
        }

        callback = callback || function () {};

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

        // TODO
        if (typeof route === "string") {
            route = new RegExp("^" + route + "$");
        }

        if (route.constructor.name === "RegExp") {

            sRoute.regexp = route;
            sRoute.type = "regexp";

            if (!method) {
                sRoute.handler = generateCallback();
            } else {
                sRoute.url = {};
                sRoute.url[method] = generateCallback();
            }

            self._sServer._regexpRoutes.push(sRoute);
            return;
        }

        if (!method) {
            sRoute = method;
        } else {
            method = method.toLowerCase();
            sRoute[method] = generateCallback();
        }

        self._sServer._routes[route] = sRoute;
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
