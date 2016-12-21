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
          , views: {
                path: `${__dirname}/views`
              , name: "ajs"
            }
        });

        // Listen for load
        server.on("load", cb);

        // Add handler page
        server.addPage("/", lien => {
            lien.end("Hello World");
        });

        // Add a dynamic route
        server.addPage("/post/:id", lien => {
            if (lien.fromBeforeHook) {
                let res = "1";
                if (lien.anotherFromBeforeHook) {
                    res += "1";
                }
                return lien.end(res);
            }
            lien.end("Post id: " + lien.params.id);
        });

        // Add a static file
        server.addPage("/test", "index.html");
        server.errorPages();

        server.on("serverError", err => {
            console.log(err.stack);
        });
    });

    t.it("add a static url to test lien fields", (cb) => {
        let url = `${URL}templates/bar?foo=bar`;
        server.addPage("/templates/bar", lien => {
            t.expect(lien.href).toBe(url.replace(":9000", ""));
            t.expect(lien.path).toBe("/templates/bar");
            t.expect(lien.full_path).toBe("/templates/bar?foo=bar");
            t.expect(lien.host).toBe("localhost");
            t.expect(lien.protocol).toBe("http");
            t.expect(lien.domain).toBe("http://localhost");
            t.expect(lien.query.foo).toBe("bar");
            lien.end();
        });
        request(url, cb);
    });

    t.it("add a static url which renders templates", () => {
        server.addPage("/templates/foo", lien => {
            lien.render("main", { page: "Home" });
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

    t.should("check before adding the hook", cb => {
        request(`${URL}post/12`, (err, body, res) => {
            t.expect(body).toBe("Post id: 12");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("add before hook", () => {
        server.hook("before", "/post/:id", "get", lien => {
            lien.fromBeforeHook = true;
        });
    });

    t.should("check after the before hook", cb => {
        request(`${URL}post/12`, (err, body, res) => {
            t.expect(body).toBe("1");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("add before hook", () => {
        server.hook("before", "*", "get", lien => {
            lien.anotherFromBeforeHook = true;
        });
    });

    t.should("check after the before hook", cb => {
        request(`${URL}post/12`, (err, body, res) => {
            t.expect(body).toBe("11");
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

    t.should("add different pages", () => {
        let articleIds = {
            a: "Hello World!"
          , b: "Hello Mars!"
        };
        server.addPage("/foo/article/:id", lien => {
            let content = articleIds[lien.params.id];
            if (content) {
                lien.end(content);
            } else {
                lien.next();
            }
        });
    });

    t.it("possible-404 page (foo/article/a)", cb => {
        request(`${URL}foo/article/a`, (err, body, res) => {
            t.expect(body).toBe("Hello World!");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("possible-404 page (foo/article/b)", cb => {
        request(`${URL}foo/article/b`, (err, body, res) => {
            t.expect(body).toBe("Hello Mars!");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("possible-404 page (foo/article/c)", cb => {
        request(`${URL}foo/article/c`, (err, body, res) => {
            t.expect(err).toBe(null);
            t.expect(body.match("404")).toNotBe(null);
            t.expect(res.statusCode).toBe(404);
            cb();
        });
    });

    t.should("add different pages, overriding the public dir", () => {
        server.addPage("/foo/bar", lien => {
            lien.end("foo bar");
        });
        server.addPage("/foo/:dyn", lien => {
            lien.end("foo:" + lien.params.dyn);
        });
    });

    t.it("check foo index before adding the custom route", cb => {
        request(`${URL}foo`, (err, body, res) => {
            t.expect(body).toBe("html foo\n");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("load static HTML file", cb => {
        request(`${URL}test.html`, (err, body, res) => {
            t.expect(body).toBe("test\n");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("check foo/bar ", cb => {
        request(`${URL}foo/bar`, (err, body, res) => {
            t.expect(body).toBe("foo bar");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("override public dir", () => {
        server.addPage("/foo", lien => {
            lien.end("foo index");
        });
    });

    t.it("check foo index after adding the custom route", cb => {
        request(`${URL}foo`, (err, body, res) => {
            t.expect(body).toBe("foo index");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("check foo/:dyn ", cb => {
        request(`${URL}foo/baz`, (err, body, res) => {
            t.expect(body).toBe("foo:baz");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("add dynamic page", () => {
        server.addPage("/:fooo", lien => {
            lien.end("dynamic:" + lien.params.fooo);
        });
    });

    t.it("check /:dyn ", cb => {
        request(`${URL}baz`, (err, body, res) => {
            t.expect(body).toBe("dynamic:baz");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("load static HTML file", cb => {
        server.hook("before", ":foo.*", (lien, cb) => {
            if (!~lien.path.indexOf(".")) {
                return cb();
            }
            lien.next();
        });
        request(`${URL}test.html`, (err, body, res) => {
            t.expect(body).toBe("test\n");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.it("add a static url which renders templates", cb => {
        request(`${URL}templates/foo`, (err, body, res) => {
            t.expect(body).toBe("<h1>Page: Home</h1>\n");
            t.expect(res.statusCode).toBe(200);
            cb();
        });
    });

    t.should("close the server", cb => {
        cb();
        process.exit();
    });
});

