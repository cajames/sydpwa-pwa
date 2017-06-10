import moduleAlias from 'module-alias';
import { hook, unhook } from 'node-hook';
import './lib/polyfills';
import { h } from 'preact';
import renderToString from 'preact-render-to-string';

// install fake globals, (too lazy to existence check in components)
global.location = { href: '/', pathname: '/' };
global.history = {};

// install src/lib before node_modules
moduleAlias.addPath(__dirname + '/lib');

// install CSS modules (just to generate correct classNames and support importing CSS & LESS)
require('css-modules-require-hook')({
  rootDir: require('path').resolve(__dirname),
  generateScopedName: `[local]`,
  extensions: ['.scss', '.css'],
  processorOpts: { parser: require('postcss-scss').parse }
});

// allow importing text
hook('.svg', (content, name) => {
  content = content.toString('utf8');
  content = content.replace(/"/g, "'");
  content = content.replace(/\s+/g, " ");
  content = content.replace(/[{}\|\\\^~\[\]`"<>#%]/g, function(match) {
    return '%'+match[0].charCodeAt(0).toString(16).toUpperCase();
  });

  var data = 'data:image/svg+xml,' + content.trim();
  return 'module.exports = ' + JSON.stringify(data);
});

// strip webpack loaders from import names
let { Module } = require('module');
let oldResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain) {
  request = request.replace(/^.*\!/g, '');
  return oldResolve.call(this, request, parent, isMain);
};

// actually import the app
let App = require('./components/app').default;

// restore resolution without loader stripping
Module._resolveFilename = oldResolve;

// remove text loader hook
unhook('.svg');

export default function render({ url = '/', ...props }) {
  location.href = location.path = url;
  return renderToString(h(App, { url, ...props }));
}
