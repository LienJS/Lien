"use strict";

const tester = require("tester")
    , lien = require("..")
    ;

tester.describe("lien", t => {
    t.should("Another lightweight NodeJS framework. Lien is the link between request and response objects.", () => {
        t.except(lien()).toEqual(/*...*/);
    });
});