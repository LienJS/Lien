var Lien = require("../lib/index");

var app = new Lien({
    host: "localhost"
  , port: 9000
});

app.on("request", function (lien) {
    lien.end({
        foo: "bar"
    });
});
