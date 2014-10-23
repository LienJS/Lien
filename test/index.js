var Lien = require("../lib/index");

var app = new Lien({
    host: "localhost"
  , port: 9000
});

app.page.add("/", "post", function (lien) {
    console.log(">>>");
    lien.end("hi");
});

//app.on("request", function (lien) {
//    lien.end({
//        foo: "bar"
//      , search: lien.search
//    });
//});
