var Statique = require("statique")
  , Events = require("events")
  , EventEmitter = Events.EventEmitter
  , Http = require("http")
  , Url = require("url")
  , QueryString = require("querystring")
  , LienCreator = require("./creator")
  ;

var Lien = module.exports = function (opt_options) {

    var self = new EventEmitter();
    self.routes = {};

    self._sServer = new Statique({
        root: opt_options.root || (__dirname + "/public")
      , cache: opt_options.cache
    }).setRoutes(self.routes);

    self._server = Http.createServer(function (request, response) {
        if (self._sServer.exists(request, response)) {
            self._sServer.serve(request, response);
        } else {
            self.emit("request", LienCreator.call(self, req, res));
        }
    });

    self._server.listen(opt_options.port, opt_options.host);

    /*!
     * Methods
     * */
    self.page = {};
    self.page.add = function (route, method, callback) {

        var sRoute = {};

        if (typeof method === "function") {
            callback = method;
            method = undefined;
        }

        function generateCallback() {
            return function (req, res, form) {
                var lien = LienCreator.call(self, req, res);
                if (req.method.toLowerCase() === "post") {
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

                        lien.data = form.data;
                        callback.call(self, lien);
                    });
                }
                callback.call(self, lien);
            }
        }

        // TODO
        if (typeof route === "string") {
            route = new RegExp(route);
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
