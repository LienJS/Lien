"use strict";

const tester = require("tester")
    , Lien = require("..")
    , request = require("tinyreq")
    , fs = require("fs")
    ;

const URL = "http://localhost:9000/";

tester.describe("lien", t => {

    let server = null;

    // Init lien server
    t.should("start the server", cb => {

        // Start the server
        server = new Lien({
            host: "localhost"
          , port: 9000
          , public: __dirname + "/public"
        });

        // Listen for load
        server.on("load", cb);

        // Add handler page
        server.addPage("/", lien => {
            lien.end("Hello World");
        });

        // Add a dynamic route
        server.addPage("/post/:id", lien => {
            lien.end("Post id: " + lien.params.id);
        });

        // Add a static file
        server.addPage("/test", "/index.html");
        server.errorPages();

        server.on("serverError", err => {
            console.log(err.stack);
        });
    });

    t.should("static route", cb => {
        request(URL, (err, body, res) => {
            t.expect(body).toBe("Hello World");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("serve file", cb => {
        request(`${URL}test`, (err, body, res) => {
            t.expect(body).toBe(fs.readFileSync(`${__dirname}/public/index.html`, "utf8"));
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("add before hook", () => {
        server.hook("before", "/post/:id", "get", lien => {
            lien.fromBeforeHook = true;
        });
    });

    t.should("check before hook", cb => {
        request(`${URL}post/12`, (err, body, res) => {
            t.expect(body).toBe("Post id: 12");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("add after hook", () => {
        server.hook("after", "/post/:id", "get", (res, next) => {
            res.content = "hi";
            next();
        });
    });

    t.should("check after hook", cb => {
        request(`${URL}post/12`, (err, body, res) => {
            t.expect(body).toBe("hi");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("close the server", cb => {
        cb();
        process.exit();
    });
});

