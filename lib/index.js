var Statique = require("statique")
  , Events = require("events")
  , EventEmitter = Events.EventEmitter
  , Http = require("http")
  , Url = require("url")
  , ConvertToBuffer = require("./to-buffer")
  , QueryString = require("querystring")
  ;

var Lien = module.exports = function (opt_options) {

    var self = new EventEmitter();

    self._sServer = new Statique({
        root: opt_options.root || (__dirname + "/public")
      , cache: opt_options.cache
    });

    self._server = Http.createServer(function (request, response) {

        // Normalize the pathname
        var pathName = Url.parse(request.url, true).pathname;
        if (pathName.substr(-1) !== "/") {
            pathName += "/";
        }
        var search = QueryString.parse(request.url.substring(request.url.indexOf("?") + 1))
          , lien = {
                req: request
              , res: response
              // TODO search params
              , search: search
              , data: {}
              , pathName: pathName
              , end: function (content, status) {

                    // TODO Handle content type
                    if (!content) {
                        return self._sServer.serve(this.req, this.res);
                    }

                    var res = ConvertToBuffer(content);
                    self._sServer.sendRes(this.res, status || 200, res.headers, res.buffer);
                }
            }
        ;

        self.emit("request", lien);
    });

    self._server.listen(opt_options.port, opt_options.host);

    return self;
};
