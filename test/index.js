var Lien = require("../lib/index");

var app = new Lien({
    host: "localhost"
  , port: 9000
});

app.page.add("/", "post", function (lien) {
    console.log(">>>");
    lien.end("hi");
});

setTimeout(function () {
    console.log(">>>");
    app.page.delete("/");
}, 5000);

//app.on("request", function (lien) {
//    lien.end({
//        foo: "bar"
//      , search: lien.search
//    });
//});
