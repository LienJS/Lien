var ConvertToBuffer = require("./to-buffer")
  , Url = require("url")
  , QueryString = require("querystring")
  , StreamBuffers = require("stream-buffers")
  , Session = require("./session");
  ;

const SID_NAME = "_sid";


var LienCreator = module.exports = function (req, res) {

    var self = this;

    // Normalize the pathname
    var pathName = Url.parse(req.url, true).pathname;
    pathName = pathName.replace(/(\/[^]+)\/$/, "$1");

    var search = QueryString.parse(req.url.substring(req.url.indexOf("?") + 1))
      , lien = {
            req: req
          , res: res
          , search: search
          , method: req.method.toLowerCase()
          , pathName: pathName
          , file: function (path, customRoot) {
                self._sServer.serveFile(path, 200, lien.res, lien.req, {}, customRoot);
            }
          , cookies: function () {
                var cookies = {}
                  , rc = lien.req.headers.cookie
                  ;

                rc && rc.split(";").forEach(function(cookie) {
                    var parts = cookie.split("=");
                    cookies[parts.shift().trim()] = decodeURIComponent(parts.join("="));
                });

                return cookies;
            }
          , cookie: function (cookie, value) {

                var pCookie = encodeURIComponent(cookie)
                  , pValue = encodeURIComponent(value)
                  ;

                if (value) {
                    var setCookie = pCookie + "=" + pValue;
                    res.setHeader("Set-Cookie", setCookie);
                    return setCookie;
                }

                if (value === null) {
                    res.setHeader("Set-Cookie", pCookie + "=___deleted; expires=Thu, 01 Jan 1970 00:00:00 GMT");
                    return null;
                }

                return lien.cookies()[cookie];
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
                self._sServer.sendRes(lien.res, status || 200, r.headers);

                var myReadableStreamBuffer = new StreamBuffers.ReadableStreamBuffer({
                    frequency: 1
                });
                myReadableStreamBuffer.put(r.buffer);
                myReadableStreamBuffer.pipe(lien.res);
                myReadableStreamBuffer.on("end", function () {
                    lien.res.end();
                });
            }
        }
    ;

    lien.session = Session(lien);

    return lien;
};
