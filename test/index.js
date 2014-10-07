var Lien = require("../index");

var app = new Lien({
    host: "localhost"
  , port: 9000
});

app.on("request", function (lien) {
    lien.end("Hello World!", 200);
});
