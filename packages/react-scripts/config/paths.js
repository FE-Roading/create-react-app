// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * 返回项目主要配置对应的路径，主要有以下几种情况处理：
  1、已通过npm(yarn) eject暴露webpack配置的项目，会查找project/config，因此此种情况下必须修改改文件夹内的配置。
  2、未暴露webpack配置文件的项目，会查找project/node_modules/react-scripts。
  3、在react-create-script的github项目中，开发调试react-scripts时，会查找create-react-app/packages/react-scripts/config。
 */
// @remove-on-eject-end
'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

// Make sure any symlinks in the project folder are resolved:
// https://github.com/facebook/create-react-app/issues/637
// 项目根目录
const appDirectory = fs.realpathSync(process.cwd());
// 返回与项目根目录凭借的目录地址
const resolveApp = relativePath => path.resolve(appDirectory, relativePath);
// 格式为；/app1这种，getServedPath中有详细说明
const envPublicUrl = process.env.PUBLIC_URL;

/**
 * 对传入地址的末尾的/按需求进行保留、添加、删除
 * @param {string} inputPath 出入地址
 * @param {boolean} needsSlash 是否需要/
 */
function ensureSlash(inputPath, needsSlash) {
  const hasSlash = inputPath.endsWith('/');
  if (hasSlash && !needsSlash) {
    return inputPath.substr(0, inputPath.length - 1);
  } else if (!hasSlash && needsSlash) {
    return `${inputPath}/`;
  } else {
    return inputPath;
  }
}

/**
 * 静态资源路径前缀：webpack打包时，对应静态文件的前置路径。与nginx部署时，项目文件夹下对应的多个子项目的类型。getServedPath中有详细说明
 * 来源是：process.env.PUBLIC_URL[格式如：/app1]或package.json对应的homepage字段[格式为：http://www.baidu.com/app1/]
 * @param {object} appPackageJson package.json配置
 */
const getPublicUrl = appPackageJson =>
  envPublicUrl || require(appPackageJson).homepage;

// We use `PUBLIC_URL` environment variable or "homepage" field to infer
// "public path" at which the app is served.
// Webpack needs to know it to put the right <script> hrefs into HTML even in
// single-page apps that may serve index.html for nested URLs like /todos/42.
// We can't use a relative path in HTML because we don't want to load something
// like /todos/42/static/js/bundle.7289d.js. We have to know the root.
function getServedPath(appPackageJson) {
  const publicUrl = getPublicUrl(appPackageJson);
  const servedUrl =
    envPublicUrl || (publicUrl ? url.parse(publicUrl).pathname : '/');
  return ensureSlash(servedUrl, true);
}

const moduleFileExtensions = [
  'web.mjs',
  'mjs',
  'web.js',
  'js',
  'web.ts',
  'ts',
  'web.tsx',
  'tsx',
  'json',
  'web.jsx',
  'jsx',
];

// Resolve file paths in the same order as webpack
/**
 * 查找项目文件夹下对应路径filePath的路径。文件类型：优先按moduleFileExtensions配置批次，存在则返回路径，不存在则当成js文件路径返回
 * @param {目录定位函数} resolveFn
 * @param {文件路径及名称} filePath
 */
const resolveModule = (resolveFn, filePath) => {
  const extension = moduleFileExtensions.find(extension =>
    fs.existsSync(resolveFn(`${filePath}.${extension}`))
  );

  if (extension) {
    return resolveFn(`${filePath}.${extension}`);
  }

  return resolveFn(`${filePath}.js`);
};

// config after eject: we're in ./config/
// 在暴露webpack配置之后， 配置路径：项目文件夹下的config文件夹
module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp('jsconfig.json'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: getServedPath(resolveApp('package.json')),
};

// @remove-on-eject-begin
// react-scripts的根目录地址
const resolveOwn = relativePath => path.resolve(__dirname, '..', relativePath);

// config before eject: we're in ./node_modules/react-scripts/config/
// 在暴露webpack配置之前， 配置路径：./node_modules/react-scripts/config/
module.exports = {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp('jsconfig.json'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: getServedPath(resolveApp('package.json')),
  // These properties only exist before ejecting:
  ownPath: resolveOwn('.'),
  ownNodeModules: resolveOwn('node_modules'), // This is empty on npm 3
  appTypeDeclarations: resolveApp('src/react-app-env.d.ts'),
  ownTypeDeclarations: resolveOwn('lib/react-app.d.ts'),
};
// react-scripts的根目录的package.json
const ownPackageJson = require('../package.json');
// 项目中已安装的react-scripts的路径
const reactScriptsPath = resolveApp(`node_modules/${ownPackageJson.name}`);
// node_modules/react-scripts存在，且符号链接时返回为true
const reactScriptsLinked =
  fs.existsSync(reactScriptsPath) &&
  fs.lstatSync(reactScriptsPath).isSymbolicLink(); // 如果reactScriptsPath是符号链接，则返回 true。

// config before publish: we're in ./packages/react-scripts/config/
// 这种情况下是在react-create-script的github项目中，开发调试时输出的paths配置而已
if (
  !reactScriptsLinked &&
  __dirname.indexOf(path.join('packages', 'react-scripts', 'config')) !== -1
) {
  module.exports = {
    dotenv: resolveOwn('template/.env'),
    appPath: resolveApp('.'),
    appBuild: resolveOwn('../../build'),
    appPublic: resolveOwn('template/public'),
    appHtml: resolveOwn('template/public/index.html'),
    appIndexJs: resolveModule(resolveOwn, 'template/src/index'),
    appPackageJson: resolveOwn('package.json'),
    appSrc: resolveOwn('template/src'),
    appTsConfig: resolveOwn('template/tsconfig.json'),
    appJsConfig: resolveOwn('template/jsconfig.json'),
    yarnLockFile: resolveOwn('template/yarn.lock'),
    testsSetup: resolveModule(resolveOwn, 'template/src/setupTests'),
    proxySetup: resolveOwn('template/src/setupProxy.js'),
    appNodeModules: resolveOwn('node_modules'),
    publicUrl: getPublicUrl(resolveOwn('package.json')),
    servedPath: getServedPath(resolveOwn('package.json')),
    // These properties only exist before ejecting:
    ownPath: resolveOwn('.'),
    ownNodeModules: resolveOwn('node_modules'),
    appTypeDeclarations: resolveOwn('template/src/react-app-env.d.ts'), //这个配置差异
    ownTypeDeclarations: resolveOwn('lib/react-app.d.ts'),
  };
}
// @remove-on-eject-end

module.exports.moduleFileExtensions = moduleFileExtensions;
