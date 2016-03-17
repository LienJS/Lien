// Dependencies
var Lien = require("../lib");

// Init lien server
var server = new Lien({
    host: "localhost"
  , port: 9000
  , public: __dirname + "/public"
});

// Listen for load
server.on("load", err => {
    console.log(err || "Server started on port 9000.");
    err && process.exit(1);
});

// Add page
server.addPage("/", lien => {
    lien.end("Hello World");
});

// Add a dynamic route
server.addPage("/post/:id", lien => {
    lien.end("Post id: " + lien.params.id);
});

server.addPage("/test", "/index.html");
server.errorPages();

server.on("serverError", err => {
    console.log(err.stack);
});
