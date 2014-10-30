var ConvertToBuffer = require("./to-buffer")
  , Url = require("url")
  , QueryString = require("querystring")
  ;

var LienCreator = module.exports = function (req, res) {

    var self = this;

    // Normalize the pathname
    var pathName = Url.parse(req.url, true).pathname;
    if (pathName.substr(-1) !== "/") {
        pathName += "/";
    }

    var search = QueryString.parse(req.url.substring(req.url.indexOf("?") + 1))
      , lien = {
            req: req
          , res: res
          , search: search
          // TODO Params
          , params: {}
          , pathName: pathName
          , file: function (path) {
                self._sServer.serveFile(path, 200, lien.res, lien.req);
            }
          , end: function (content, status) {

                if (typeof content === "number") {
                    status = content;
                    content = undefined;
                }

                if (status >= 400) {
                    self._sServer.error(lien.req, lien.res, status, "Not found");
                    return;
                }

                var r = ConvertToBuffer(content);
                self._sServer.sendRes(lien.res, status || 200, r.headers, r.buffer);
            }
        }
    ;

    return lien;
};
