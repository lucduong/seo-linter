'use strict';

const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const yaml = require('js-yaml');

const isReadableStream = obj =>
  obj instanceof stream.Readable &&
  typeof (obj._read === 'function') &&
  typeof (obj._readableState === 'object');
/**
 * Load yaml config file to javascript object
 *
 * @param {string} filename: provide the absolute path of yaml configuration file.
 * @param {string} config stands for key of configuration
 */
exports.loadYamlConfig = (filename, config) => {
  if (!filename) {
    filename = path.resolve('config.yml');
  }
  if (!fs.existsSync(filename))
    return Promise.reject(
      new Error(`Provied path (${filename}) does not exist!`)
    );

  return new Promise((resolve, reject) => {
    try {
      const cfg = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
      if (config && !cfg[config])
        throw new Error(`Config with name '${config}' doesn't exist`);
      return config ? resolve(cfg[config]) : resolve(cfg);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Load page content from url
 *
 * @param {string} url
 * @returns { $ } cheerio wrapped html tag
 * @example:
 * const { loadUrl } = require('./helper');
 * const { $ } = await loadUrl('https://google.com.vn');
 */
exports.loadUrl = url => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return Promise.reject(
      new Error('URL must be start with either http:// or https://')
    );
  }
  const uri = url.toLowerCase();
  const options = {
    uri,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    transform: body => {
      return cheerio.load(body);
    }
  };

  return request(options).then($ => $('html'));
};

/**
 * Load page content from HTML file
 *
 * @param {string} html path
 * @returns { $ } cheerio wrapped html tag
 * @example:
 * const { loadFile } = require('./helper');
 * const { $ } = await loadFile('/path/to/htmlfile.html');
 */
exports.loadFile = filename => {
  if (!filename) return Promise.reject(new Error('Filename is required'));
  return new Promise((resolve, reject) => {
    if (typeof filename === 'string') {
      fs.readFile(filename, (err, html) => {
        if (err) return reject(err);
        const $ = cheerio.load(html);
        return resolve($('html'));
      });
    } else if (isReadableStream(filename)) {
      filename.on('data', html => {
        const $ = cheerio.load(html);
        resolve($('html'));
      });
    } else {
      reject(new Error('Filename was provided but invalid'));
    }
  });
};

/**
 * Load page content from HTML string
 *
 * @param {string} html string
 * @returns { $ } cheerio wrapped html tag
 * @example:
 * const { loadHTML } = require('./helper');
 * const { $ } = await loadHTML('<html>...</html>');
 */
exports.loadHTML = html => {
  if (!html)
    return Promise.reject(
      new Error('HTML argument is required and it should not be empty')
    );
  const $ = cheerio.load(html);
  return Promise.resolve($('html'));
};
