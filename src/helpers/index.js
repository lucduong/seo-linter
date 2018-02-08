'use strict';

const SEOLinter = require('./linter');
const loader = require('./loader');
const TagRule = require('./rule');

module.exports = {
  SEOLinter,
  TagRule,
  ...loader
};
