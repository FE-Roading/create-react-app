// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 该模块主要实现有两个功能：
 * 1、把自定义的环境变量文件内容定义到process.env中
 * 2、将module的解析路径中[process.env.NODE_PATH]的相对路径全部调整为当前项目下
 * 3、暴露函数getClientEnvironment：在webpack.config.js中是用了
 */
// @remove-on-eject-end
'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');

// Make sure that including paths.js after env.js will read .env variables.
// env.js 文件在引入 ./paths.js 之后，立即把他从cache中删除掉，
// 这样下次如果有其他的模块引入paths.js，就不会从缓存里面去获取，保证了paths.js里面执行逻辑都会用到最新的环境变量。
delete require.cache[require.resolve('./paths')];

const NODE_ENV = process.env.NODE_ENV;
if (!NODE_ENV) {
  throw new Error(
    'The NODE_ENV environment variable is required but was not specified.'
  );
}

/**
* 查找自定义的dotnev格式的环境变量再载入后进行添加到process.env中，这个配置文件查找路径有以下几种情况：
1、已通过npm(yarn) eject暴露webpack配置的项目，会查找project/config，因此此种情况下必须修改改文件夹内的配置。
2、未暴露webpack配置文件的项目，会查找project/node_modules/react-scripts。
3、在react-create-script的github项目中，开发调试react-scripts时，会查找create-react-app/packages/react-scripts/config。
* */
// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${paths.dotenv}.${NODE_ENV}.local`,
  `${paths.dotenv}.${NODE_ENV}`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${paths.dotenv}.local`,
  paths.dotenv,
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile,
      })
    );
  }
});
/************************/

// We support resolving modules according to `NODE_PATH`.
// This lets you use absolute paths in imports inside large monorepos:
// https://github.com/facebook/create-react-app/issues/253.
// It works similar to `NODE_PATH` in Node itself:
// https://nodejs.org/api/modules.html#modules_loading_from_the_global_folders
// Note that unlike in Node, only *relative* paths from `NODE_PATH` are honored.
// Otherwise, we risk importing Node.js core modules into an app instead of Webpack shims.
// https://github.com/facebook/create-react-app/issues/1023#issuecomment-265344421
// We also resolve them to make sure all tools using them work consistently.
// 将module的解析路径中[process.env.NODE_PATH]的相对路径全部调整为当前项目下
const appDirectory = fs.realpathSync(process.cwd());
process.env.NODE_PATH = (process.env.NODE_PATH || '')
  .split(path.delimiter) // 提供操作系统的路径分隔符
  .filter(folder => folder && !path.isAbsolute(folder)) // 目录不为空，且是相对目录
  .map(folder => path.resolve(appDirectory, folder)) // 将得到的目录与APP进行拼接
  .join(path.delimiter);

// Grab NODE_ENV and REACT_APP_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const REACT_APP = /^REACT_APP_/i;

/**
 * 过滤出来process.env 的REACT_APP_*环境变量，另外再添加两个额外配置NODE_ENV，PUBLIC_URL。再序列化后再webpack.config.js中是用了
 * @param {string} publicUrl
 */
function getClientEnvironment(publicUrl) {
  const raw = Object.keys(process.env)
    .filter(key => REACT_APP.test(key))
    .reduce(
      (env, key) => {
        env[key] = process.env[key];
        return env;
      },
      {
        // Useful for determining whether we’re running in production mode.
        // Most importantly, it switches React into the correct mode.
        NODE_ENV: process.env.NODE_ENV || 'development',
        // Useful for resolving the correct path to static assets in `public`.
        // For example, <img src={process.env.PUBLIC_URL + '/img/logo.png'} />.
        // This should only be used as an escape hatch. Normally you would put
        // images into the `src` and `import` them in code to get their paths.
        PUBLIC_URL: publicUrl,
      }
    );
  // Stringify all values so we can feed into Webpack DefinePlugin
  // 字符串化所有值，以便我们可以提供给Webpack DefinePlugin
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),
  };

  return { raw, stringified };
}

module.exports = getClientEnvironment;
