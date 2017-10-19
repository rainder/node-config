"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rootwd = require('rootwd');
const path = require("path");
const originalConfig = require("config");
const _ = require("lodash");
const watch = require("watch");
const events_1 = require("events");
const CONFIG = {};
const LOADERS = [];
const CONFIG_DIR = path.resolve(rootwd.toString(), 'config');
function loadConfig() {
    Object.assign(CONFIG, originalConfig.util.loadFileConfigs(CONFIG_DIR));
}
loadConfig();
watch.watchTree(CONFIG_DIR, (f, curr, prev) => {
    if (typeof f === 'object' && prev === null && curr === null) {
        return;
    }
    LOADERS.forEach((loader) => loader());
});
/**
 *
 */
class Config extends events_1.EventEmitter {
    constructor(schema) {
        super();
        this.schema = schema;
        this.load();
        LOADERS.push(() => {
            this.load();
            this.emit('change');
        });
    }
    /**
     *
     * @returns {Config<T>}
     */
    load() {
        this.data = {};
        const traverse = (object, prefixPath) => {
            Object.entries(object).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    prefixPath.push(key);
                    return traverse(value, prefixPath);
                }
                const actualValue = _.get(CONFIG, value);
                if (actualValue === undefined) {
                    throw new Error(`Not defined in the config: ${value}`);
                }
                _.set(this.data, [].concat(...prefixPath, key).join('.'), actualValue);
            });
        };
        traverse(this.schema, []);
        return this;
    }
    /**
     *
     * @param {string} name
     * @returns {any}
     */
    get(name) {
        const value = _.get(this.data, name);
        if (value === undefined) {
            throw new Error(`Not defined in the config: ${name}`);
        }
        return value;
    }
    /**
     *
     * @param {T} schema
     * @returns {T}
     */
    static init(schema) {
        const instance = new Config(schema);
        return new Proxy(instance, {
            get: function (target, name) {
                return target[name] || target.get(name);
            },
        });
    }
}
exports.default = Config;
exports.init = Config.init;
//# sourceMappingURL=index.js.map