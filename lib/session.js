var Storage = require('node-persist');

// Init Storage
Storage.initSync({
// TODO Configurable
    dir: "tmp"
});

module.exports = function (lien) {

    var Session = {
        _sid: lien.cookie("_sid") || null
      , start: function (data) {
            data = data || lien.data;

            var _sid = Math.random().toString(36);

            lien.cookie("_sid", _sid);
            Session._sid = _sid;

            Storage.setItem(_sid, {
                data: data
            });
        }
      , destroy: function () {
            Storage.removeItem(Session._sid);
            delete lien._sid;
        }
      , getData: function () {
            return Object(Storage.getItem(Session._sid)).data || null;
        }
    };

    return Session;
};
