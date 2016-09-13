'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const config = require('config');
const events = require('events');

let CONFIG = config.util.loadFileConfigs();

module.exports = new class extends events.EventEmitter {
  constructor() {
    super();

    this.autoloaders = [];

    this._initWatcher();
  }

  _initWatcher() {
    const configDir = this._getConfigDir();
    const dirContents = fs.readdirSync(configDir);
    const watchOptions = { persistent: false };

    const onChange = () => {
      CONFIG = config.util.loadFileConfigs();
      _.each(this.autoloaders, fn => fn());

      this.emit('reload');
    };

    for (let file of dirContents) {
      if (/^\./.test(file)) {
        continue;
      }

      fs.watchFile(path.resolve(configDir, file), watchOptions, onChange);
    }
  }

  _getConfigDir() {
    const dir = path.join(process.cwd(), 'config');
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
      _.each(_schema, (value, key) => {
        schema[key] = this.get(value);
      });
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
   *
   * @param path
   * @returns {*}
   */
  get(path) {
    const value = _.get(CONFIG, path);

    if (value === undefined) {
      throw new Error(`Not defined in the config: ${path}`);
    }

    return _.cloneDeep(value);
  }
}