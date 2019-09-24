/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const browserslist = require('browserslist');
const chalk = require('chalk');
const os = require('os');
const inquirer = require('inquirer');
const pkgUp = require('pkg-up');
const fs = require('fs');

const defaultBrowsers = {
  production: ['>0.2%', 'not dead', 'not op_mini all'],
  development: [
    'last 1 chrome version',
    'last 1 firefox version',
    'last 1 safari version',
  ],
};
/**
 * 需用户确认是否需要设置默认浏览器配置。如果处于非交互模式，默认为设置
 * @param {*} isInteractive
 */
function shouldSetBrowsers(isInteractive) {
  if (!isInteractive) {
    return Promise.resolve(true);
  }

  const question = {
    type: 'confirm',
    name: 'shouldSetBrowsers',
    message:
      chalk.yellow("We're unable to detect target browsers.") +
      `\n\nWould you like to add the defaults to your ${chalk.bold(
        'package.json'
      )}?`,
    default: true,
  };

  return inquirer.prompt(question).then(answer => answer.shouldSetBrowsers);
}
/**
 * 检测是否配置browserslist:
 *   > 有则为resolve;
 *   > 没有则需要确认是否需要设置：如果是非console模式，默认为设置默认值；如果是console模式，由用户选择是否设置，不设置则直接reject
 *   > browserlist的三种配置方式： browserslist文件、.browserslistrc文件、package.json的browserslist字段
 * @param {string} dir 项目目录
 * @param {boolean} isInteractive 是console模式
 * @param {boolean} retry  重试
 */
function checkBrowsers(dir, isInteractive, retry = true) {
  const current = browserslist.findConfig(dir); // 在项目文件夹下查找browser配置并返回具体的结果[有多重配置方式]
  if (current != null) {
    return Promise.resolve(current);
  }

  if (!retry) {
    // retry==false && current==null
    return Promise.reject(
      new Error(
        chalk.red(
          'As of react-scripts >=2 you must specify targeted browsers.'
        ) +
          os.EOL +
          `Please add a ${chalk.underline(
            'browserslist'
          )} key to your ${chalk.bold('package.json')}.`
      )
    );
  }

  return shouldSetBrowsers(isInteractive).then(shouldSetBrowsers => {
    if (!shouldSetBrowsers) {
      // 不设置默认浏览器：在执行一次时直接reject
      return checkBrowsers(dir, isInteractive, false);
    }

    return (
      pkgUp(dir)
        .then(filePath => {
          if (filePath == null) {
            return Promise.reject();
          }
          const pkg = JSON.parse(fs.readFileSync(filePath));
          pkg['browserslist'] = defaultBrowsers;
          fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + os.EOL);

          browserslist.clearCaches();
          console.log();
          console.log(
            `${chalk.green('Set target browsers:')} ${chalk.cyan(
              defaultBrowsers.join(', ')
            )}`
          );
          console.log();
        })
        // Swallow any error
        .catch(() => {})
        .then(() => checkBrowsers(dir, isInteractive, false))
    );
  });
}

module.exports = { defaultBrowsers, checkBrowsers };
