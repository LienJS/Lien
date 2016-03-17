// Dependencies
const Lien = require("../lib");

const users = {
    Alice: "123"
  , Bob: "1234"
};

// Init lien app
const app = new Lien({
    host: "localhost"
  , port: 9000
  , public: __dirname + "/public"
  , session: {
        storeOptions: {
            url: "mongodb://localhost/test-app"
        }
    }
});

// Listen for load
app.on("load", err => {
    console.log(err || "App started on port 9000.");
    err && process.exit(1);
});

// Add page
app.addPage("/", lien => {
    if (lien.getSessionData("logged_in")) {
        lien.file("logout.html");
    } else {
        lien.file("login.html");
    }
});

app.addPage("/api/login", "post", lien => {
    if (!lien.data.username || !lien.data.password) {
        return lien.apiError("Incomplete data.");
    }

    if (lien.getSessionData("logged_in")) {
        return lien.redirect("/");
    }

    if (users[lien.data.username] === lien.data.password) {
        lien.startSession({
            logged_in: true
          , authenticated_at: new Date()
          , username: lien.data.username
        });
        return lien.redirect("/");
    }

    lien.apiError("Invalid credentials.", 403);
});

app.addPage("/api/session", lien => {
    lien.end(lien.getSessionData());
});

app.addPage("/api/logout", "post", lien => {
    if (!lien.getSessionData("logged_in")) {
        return lien.apiError("You were not logged in anyways.");
    }

    lien.destroySession();
    lien.redirect("/");
});

// Add a dynamic route
app.addPage("/post/:id", lien => {
    lien.end("Post id: " + lien.params.id);
});

app.addPage("/test", "/index.html");

app.on("serverError", err => {
    console.log(err.stack);
});
