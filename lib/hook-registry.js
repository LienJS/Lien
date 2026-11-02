import { METHODS } from "node:http";
import { pathToRegexp } from "path-to-regexp";
import Hooks from "./hooks.js";

/**
 * @typedef {Object<string, Object<string, Array<{re: RegExp, trans: Hooks}>>>} HookRegistry
 * Hook definitions indexed by type and lowercase HTTP method.
 * @private
 */

/**
 * HTTP method names used to register the public shortcuts.
 *
 * @type {Array<string>}
 * @private
 */
export const methods = [...new Set(METHODS.map(method => method.toLowerCase()))];
/**
 * Converts the legacy wildcard to the equivalent matcher pattern.
 *
 * @param {import("./server.js").RoutePattern} url The pattern to normalize.
 * @returns {import("./server.js").RoutePattern}
 * @private
 */
export const normalizePattern = url => url === "*" ? "(.*)" : url;

/**
 * Compiles a legacy Lien pattern for Express 5 and restores named parameters.
 *
 * @param {import("./server.js").RoutePattern} url The route pattern.
 * @returns {{regexp: RegExp, restoreParams: Function}} The matcher and parameter middleware.
 * @private
 */
export function compileRoute (url) {
    const keys = [];
    const regexp = pathToRegexp(normalizePattern(url), keys);
    const restoreParams = (req, res, next) => {
        const captures = req.params;
        req.params = Object.fromEntries(keys.flatMap((key, index) => {
            const value = captures[key.name] ?? captures[index];
            return value === undefined ? [] : [
                [key.name, value]
            ];
        }));
        next();
    };
    return { regexp, restoreParams };
}

/**
 * Selects registered pipelines by request path or by identical compiled pattern.
 *
 * @param {HookRegistry} registry The hook definitions.
 * @param {string} type The hook type.
 * @param {string|import("./server.js").RoutePattern} url The request path or registered pattern.
 * @param {string} method The lowercase HTTP method.
 * @param {boolean} [strict=false] Whether to compare compiled patterns.
 * @returns {Hooks|null} The selected pipeline, or null.
 * @private
 */
export function getHooks (registry, type, url, method, strict = false) {
    const pattern = strict ? pathToRegexp(normalizePattern(url)).toString() : null;
    const matching = (registry[type]?.[method] ?? []).filter(({ re }) => {
        re.lastIndex = 0;
        return strict ? re.toString() === pattern : re.test(url);
    }).map(({ trans }) => trans);
    if (!matching.length) {
        return null;
    }
    return matching.length === 1 ? matching[0] : new Hooks().add(matching, Hooks.PARALLEL);
}

/**
 * Stores a native pipeline under its type, method, and compiled pattern.
 *
 * @param {HookRegistry} registry The hook definitions.
 * @param {string} type The hook type.
 * @param {import("./server.js").RoutePattern} url The registered pattern.
 * @param {string} method The lowercase HTTP method.
 * @param {Hooks} pipeline The pipeline to register.
 * @returns {Hooks} The inserted pipeline.
 * @throws {TypeError} If the pipeline is not native.
 * @private
 */
export function insertHook (registry, type, url, method, pipeline) {
    if (!(pipeline instanceof Hooks)) {
        throw new TypeError("insertHook expects a Lien.Hooks pipeline. Register external callbacks with .add().");
    }
    const group = registry[type] ??= Object.create(null);
    const hooks = group[method] ??= [];
    hooks.push({
        re: pathToRegexp(normalizePattern(url)),
        trans: pipeline
    });
    return pipeline;
}
