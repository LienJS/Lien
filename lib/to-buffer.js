/**
 * ToBuffer
 * Converts data to buffer.
 *
 * @name ToBuffer
 * @function
 * @param {Anything} data The value that will be converted to buffer.
 * @return {Object} An object containing the `contentType` and `buffer` fields.
 */
var ToBuffer = module.exports = function (data) {

    /**
     * createDataObj
     *
     * @name createDataObj
     * @function
     * @param {Buffer} buffer The buffer value.
     * @param {Object} contentType The response contentType.
     * @return {Object} An object containing the `contentType` and `buffer` fields.
     */
    function createDataObj(buffer, contentType) {
        return {
            contentType: contentType || "html"
          , buffer: buffer
        };
    }


    if (data === undefined) {
        return createDataObj(new Buffer(0));
    }

    if (typeof data === "string") {
        if (/^\<\?xml version\=/.test(data)) {
            return createDataObj(new Buffer(data), "xml");
        }
        return createDataObj(new Buffer(data));
    }

    if (data instanceof Buffer) {
        return createDataObj(data);
    }

    if (data instanceof Error) {
        return createDataObj(data.stack, "text");
    }

    try {
        data = JSON.stringify(data, null, 2);
        return createDataObj(data, "json");
    } catch (err) {
        return createDataObj(new Buffer(0));
    }

    if (data === undefined) {
        return createDataObj(new Buffer(0));
    }

    return createDataObj(new Buffer(data));
};
