// Dependencies
var ConvertToBuffer = require("./to-buffer")
  , Url = require("url")
  , QueryString = require("querystring")
  , Session = require("./session");
  ;

// Constants
const SID_NAME = "_sid";


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
var LienCreator = module.exports = function (req, res) {

    var self = this;

    // Normalize the pathname
    var pathName = Url.parse(req.url, true).pathname;
    pathName = pathName.replace(/(\/[^]+)\/$/, "$1");

    // Create lien object
    var search = QueryString.parse(req.url.substring(req.url.indexOf("?") + 1))
      , lien = {
            req: req
          , res: res
          , search: search
          , method: req.method.toLowerCase()
          , pathName: pathName

          /**
           * file
           * Serves a file to the response.
           *
           * @name file
           * @function
           * @param {String} path Relative path to the file.
           * @param {String} customRoot Absolute path to the root directory (optional).
           * @return {undefined}
           */
          , file: function (path, customRoot) {
                self._sServer.serveFile(path, 200, lien.res, lien.req, {}, customRoot);
            }

          /**
           * cookies
           * Returns the cookies from request object.
           *
           * @name cookies
           * @function
           * @return {Object} An object containing cookie keys and values.
           */
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
          , end: function (content, status, contentType, headers) {

                if (typeof contentType === "object") {
                    headers = contentType;
                    contentType = null;
                }

                if (typeof content === "number") {
                    status = content;
                    content = undefined;
                }

                if (content === undefined && status >= 400) {
                    self._sServer.error(lien.req, lien.res, status, "Not found");
                    return;
                }

                var r = ConvertToBuffer(content);
                self._sServer.sendRes(lien.res, status || 200, contentType || r.contentType, r.buffer, headers);
            }

          /**
           * redirect
           * Redirects the response to the `url` parameter.
           *
           * @name redirect
           * @function
           * @param {String} url The redirect url.
           * @return {undefined}
           */
          , redirect: function (url) {
                self._sServer.redirect(lien.res, url);
            }
        }
    ;

    // Attach session handlers
    lien.session = Session(lien);

    return lien;
};
