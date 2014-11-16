// Dependencies
var Lien = require("../lib/index");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
});

// Add page
server.page.add("/", function (lien) {
    lien.file("/index.html");
});
