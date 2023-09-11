'use strict';

const fs = require('fs');
const path = require('path');
const config = require('config');
const events = require('events');
const get = require('lodash.get');
const set = require('lodash.set');
const cloneDeep = require('lodash.clonedeep');
const merge = require('lodash.merge');
const each = require('lodash.foreach');
const isObject = require('lodash.isobject');


const _ = {
  merge,
  get,
  cloneDeep,
  each,
  set,
  isObject,
};

const CONFIG$ = Symbol();
const DIRS = ['config', 'config/local'];

module.exports = new class Config extends events.EventEmitter {
  constructor() {
    super();

    this.autoloaders = [];

    this[CONFIG$] = Config._loadConfig();
  }

  /**
   *
   */
  static _loadConfig() {
    const result = {};

    DIRS.forEach((dir) => {
      const configDir = Config._getConfigDir(dir);

      console.log(configDir)
      _.merge(result, config.util.loadFileConfigs(configDir));
    });

    return result;
  }

  /**
   *
   * @param dirName
   * @returns {*}
   * @private
   */
  static _getConfigDir(dirName) {
    const dir = path.join(process.cwd(), dirName);

    if (dir.indexOf('.') === 0) {
      return path.join(process.cwd(), dir);
    }

    return dir;
  }

  /**
   *
   * @param schema
   * @returns {*}
   */
  init(schema) {
    const _schema = _.cloneDeep(schema);
    const load = () => {
      const keys = Object.keys(_schema);

      for (const key of keys) {
        const value = _.get(_schema, key);

        if (_.isObject(value)) {
          keys.push(...Object.keys(value).map((item) => `${key}.${item}`));

          continue;
        }

        _.set(schema, key, this.get(value));
      }
    };

    load();
    this.autoloaders.push(load);

    return schema;
  }

  /**
   *
   * @param path
   * @returns {*}
   */
  get(path) {
    const value = _.get(this[CONFIG$], path);

    if (value === undefined) {
      throw new Error(`Not defined in the config: ${path}`);
    }

    return _.cloneDeep(value);
  }
}
