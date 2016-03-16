// Dependencies
var Storage = require("node-persist")
  , ul = require("ul")
  ;

// Init Storage
// TODO Configurable
Storage.initSync({
    dir: "tmp"
});

/**
 * Session
 * Attaches the sesssion handlers.
 *
 * @name Session
 * @function
 * @param {Lien} lien The lien object.
 * @return {Object} The session handlers.
 */
module.exports = function (lien) {

    var Session = {
        _sid: lien.cookie("_sid") || null

      /**
       * start
       * Starts a new session.
       *
       * @name start
       * @function
       * @param {Object} data The session data.
       * @return {undefined}
       */
      , start: function (data) {
            data = data || lien.data;

            var _sid = Math.random().toString(36);

            lien.cookie("_sid", _sid);
            Session._sid = _sid;

            this.setData(data);
        }

      , setData (data) {
            var sid = Session._sid;
            if (!sid) {
                return this.start(data);
            }

            Storage.setItem(sid, {
                data: ul.merge(data, this.getData())
            });
        }


      /**
       * destroy
       * Destroys the session.
       *
       * @name destroy
       * @function
       * @return {undefined}
       */
      , destroy: function () {
            Storage.removeItem(Session._sid);
            delete lien._sid;
        }

      /**
       * getData
       * Returns the object data.
       *
       * @name getData
       * @function
       * @return {Object} The object data.
       */
      , getData: function () {
            return Object(Storage.getItem(Session._sid)).data || null;
        }
    };

    return Session;
};
