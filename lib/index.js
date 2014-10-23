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

        if (arguments.length < 3) {
            sRoute = method;
        } else {
            method = method.toLowerCase();
            sRoute[method] = function (req, res, form) {
                var lien = LienCreator.call(self, req, res);
                if (method === "post") {
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
            };
        }
        self.routes[route] = sRoute;
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
