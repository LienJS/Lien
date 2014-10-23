var Lien = require("../lib/index");

var app = new Lien({
    host: "localhost"
  , port: 9000
});

app.on("request", function (lien) {
    console.log(lien.req.url);
    lien.end({
        foo: "bar"
      , search: lien.search
    });
});
