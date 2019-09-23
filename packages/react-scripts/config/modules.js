// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 返回对应的JS或TS配置，编译选项compilerOptions的baseUrl查找的路径数组：只允许最多存在一个配置：ts或js
 * 返回的数据结构：{ 
      additionalModulePaths, //为路径数组或null
      hasTsConfig, //boolean
 * }
 */
// @remove-on-eject-end
'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const chalk = require('react-dev-utils/chalk');
const resolve = require('resolve');

/**
 * Get the baseUrl of a compilerOptions object.
 * @param {Object} options
 * 运行过程如下：根据options.baseUrl返回值
 * 1、options.baseUrl不存在或为undefined，返回process.env.NODE_PATH中的非空路径组成的数组
 * 2、options.baseUrl是node_modules, 返回为null
 * 3、options.baseUrl是项目根目录，返回[项目根目录]
 */
function getAdditionalModulePaths(options = {}) {
  const baseUrl = options.baseUrl;

  // We need to explicitly check for null and undefined (and not a falsy value) because
  // TypeScript treats an empty string as `.`.
  if (baseUrl == null) {
    // If there's no baseUrl set we respect NODE_PATH
    // Note that NODE_PATH is deprecated and will be removed
    // in the next major release of create-react-app.

    const nodePath = process.env.NODE_PATH || '';
    return nodePath.split(path.delimiter).filter(Boolean);
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  // We don't need to do anything if `baseUrl` is set to `node_modules`. This is
  // the default behavior.
  if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
    return null;
  }

  // Allow the user set the `baseUrl` to `appSrc`.
  if (path.relative(paths.appSrc, baseUrlResolved) === '') {
    return [paths.appSrc];
  }

  // Otherwise, throw an error.
  throw new Error(
    chalk.red.bold(
      "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
        ' Create React App does not support other values at this time.'
    )
  );
}

/**
 * 获取对应的模块配置中， 编译选项compilerOptions的baseUrl查找的路径数组：只允许最多存在一个配置：ts或js
 * @param return {
 *    additionalModulePaths, //为路径数组或null
      hasTsConfig, //boolean
 * }
 */
function getModules() {
  // Check if TypeScript is setup
  const hasTsConfig = fs.existsSync(paths.appTsConfig);
  const hasJsConfig = fs.existsSync(paths.appJsConfig);

  // 只允许存在一个配置
  if (hasTsConfig && hasJsConfig) {
    throw new Error(
      'You have both a tsconfig.json and a jsconfig.json. If you are using TypeScript please remove your jsconfig.json file.'
    );
  }

  let config;

  // If there's a tsconfig.json we assume it's a
  // TypeScript project and set up the config
  // based on tsconfig.json
  if (hasTsConfig) {
    const ts = require(resolve.sync('typescript', {
      basedir: paths.appNodeModules,
    }));
    config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
    // Otherwise we'll check if there is jsconfig.json
    // for non TS projects.
  } else if (hasJsConfig) {
    config = require(paths.appJsConfig);
  }

  config = config || {};
  const options = config.compilerOptions || {};

  const additionalModulePaths = getAdditionalModulePaths(options);

  return {
    additionalModulePaths: additionalModulePaths,
    hasTsConfig,
  };
}

module.exports = getModules();
