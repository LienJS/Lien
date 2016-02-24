// Dependencies
var Lien = require("../lib");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
  , root: __dirname + "/public"
  , certificates: {
        key: __dirname + "/ssl/key.pem"
      , cert: __dirname + "/ssl/cert.pem"
    }
});

// Listen for load
server.on("load", function (err) {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add page
server.page.add("/", function (lien) {
    lien.end("Hello World");
});

// Add a dynamic route
server.page.add("/post/:id", function (lien) {
    lien.end("Post id: " + lien.params.id);
});

server.page.add("/test", "/index.html");
