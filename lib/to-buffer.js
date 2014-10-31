function createDataObj(buffer, headers) {
    return {
        headers: headers || "html"
      , buffer: buffer
    };
}

var ToBuffer = module.exports = function (data) {

    if (data === undefined) {
        return createDataObj(new Buffer(0));
    }

    if (typeof data === 'string') {
        return createDataObj(new Buffer(data));
    }

    if (data instanceof Buffer) {
        return createDataObj(data);
    }

    if (data instanceof Error) {
        data = createDataObj(data.toString());
    }

    try {
        data = JSON.stringify(data);
        createDataObj(data, "application/json; charset=utf-8");
    } catch (err) {
        return createDataObj(new Buffer(0));
    }

    if (data === undefined) {
        return createDataObj(new Buffer(0));
    }

    return createDataObj(new Buffer(data));
};
