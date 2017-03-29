'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const config = require('config');
const events = require('events');
const watch = require('watch');

const CONFIG$ = Symbol();
const DIRS = ['config', 'config/local'];

module.exports = new class Config extends events.EventEmitter {
  constructor() {
    super();

    this.autoloaders = [];

    this[CONFIG$] = Config._loadConfig();
    this._initWatcher();
  }

  /**
   *
   */
  static _loadConfig() {
    const result = {};

    DIRS.forEach((dir) => {
      const configDir = Config._getConfigDir(dir);

      _.merge(result, config.util.loadFileConfigs(configDir));
    });

    return result;
  }

  /**
   *
   * @private
   */
  _initWatcher() {
    const configDir = Config._getConfigDir('config');

    watch.watchTree(configDir, (f, curr, prev) => {
      if (typeof f == "object" && prev === null && curr === null) {
        return;
      }

      this[CONFIG$] = Config._loadConfig();
      _.each(this.autoloaders, fn => fn(this));

      this.emit('reload');
    });
  }

  /**
   *
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
  autoload(schema) {
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
   * Alias of autoload
   *
   * @param schema
   * @returns {*}
   */
  autoreload(schema) {
    return this.autoload(schema);
  }

  /**
   * Alias of autoload
   *
   * @param schema
   * @returns {*}
   */
  autoReload(schema) {
    return this.autoload(schema);
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
