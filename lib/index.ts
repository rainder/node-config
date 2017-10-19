const rootwd = require('rootwd');

import * as path from 'path';
import * as originalConfig from 'config';
import * as _ from 'lodash';
import * as watch from 'watch';

import { EventEmitter } from 'events';

const CONFIG = {};
const LOADERS: Function[] = [];
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
export default class Config<T> extends EventEmitter {
  schema: T;
  data: T;

  constructor(schema: T) {
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
    this.data = <any>{};

    const traverse = (object: any, prefixPath: string[]) => {
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
    }

    traverse(this.schema, []);

    return this;
  }

  /**
   *
   * @param {string} name
   * @returns {any}
   */
  get(name: string) {
    const value = _.get(<any>this.data, name);

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
  static init<T>(schema: T): T & Config<T> {
    const instance = new Config<T>(schema);

    return new Proxy(instance, {
      get: function (target: any, name: string) {
        return target[name] || target.get(name);
      },
    });
  }
}

export const init = Config.init;
