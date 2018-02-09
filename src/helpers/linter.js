'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const fs = require('fs');

const { loadUrl, loadHTML, loadFile } = require('./loader');
const TagRule = require('./rule');
const { ERROR_CODE } = require('../constants');

class SEOLinter {
  constructor({ rules }) {
    if (!rules) throw new Error('Rules is required!');
    if (!_.isObject(rules)) throw new Error('Rules must be an object!');

    this.errors = [];
    this.tags = [];

    //init rules
    this.initRules(rules);
  }

  /**
   * initilize rules of SEO Linter
   *
   * @param {Object} rules
   */
  initRules(rules = {}) {
    this.rulesMap = {};
    this.tags = Object.keys(rules);
    this.tags.forEach(tagName => {
      const rule = rules[tagName];
      const tagRules = _.isArray(rule)
        ? this.createTagRules(tagName, rule)
        : [this.createTagRule(tagName, rule)];

      if (this.rulesMap[tagName]) {
        this.rulesMap[tagName]['rules'] = [
          ...this.rulesMap[tagName]['rules'],
          ...tagRules
        ];
      } else {
        this.rulesMap[tagName] = { rules: tagRules };
      }
    });
  }

  /**
   * Create TagRule instance based on configuration
   *
   * @param {Object} cfgRule
   * @returns {TagRule} instance of TagRule
   */
  createTagRule(tagName, cfgRule, parent) {
    if (!tagName) {
      if (_.isEmpty(cfgRule)) throw new Error('Configuration is invalid');
      tagName = Object.keys(cfgRule)[0];
      cfgRule = cfgRule[tagName];
    }
    return new TagRule(tagName, { ...cfgRule, parent });
  }

  /**
   * Create list of TagRule based of configurations
   *
   * @param {Array} cfgRules
   * @returns {Array<TagRule>} list of TagRule
   *
   */
  createTagRules(key, cfgRules) {
    return cfgRules.map(rule => this.createTagRule(key, rule));
  }

  /**
   * Assign Cheerio Element to Each rule
   *
   * @param {*} $ cheerio document object
   */
  assignElement($) {
    this.tags.forEach(tag => {
      this.rulesMap[tag]['$'] = $.find(tag);
    });
  }

  /**
   * Create an error that
   */
  createError(rule, code, msg) {
    return {
      code,
      message: msg ? msg : `Error from <${rule.tagName}>`,
      tagName: rule.tagName
    };
  }

  /**
   * Validate rule by tagName
   *
   * @param {string} tagName
   * @returns {Array} errors - If errors is empty mean HTML document is valid with provided rules.
   */
  validate(tagName) {
    const { rules, $ } = this.rulesMap[tagName];
    return rules.reduce(
      (errors, rule) => errors.concat(this.validateRule({ rule, $ })),
      []
    );
  }

  /**
   * Validate each rule by TagRule instance
   *
   * @param {Object} param0 should be like this: { rule, $ }
   * @param {*} errors
   */
  validateRule({ rule, $ }, errors = []) {
    const { tagName, required, max, min, attrs, childs, parent } = rule;
    if (parent) {
      $ = $.find(tagName);
    }
    let elmLen = $.length;
    if (tagName === 'head' && $.html().trim() === '') {
      elmLen = 0;
    }

    // Check if required and existed first
    if (required && elmLen === 0) {
      const msgPrnt = parent ? `<${parent}> tag` : 'HTML document';
      errors.push(
        this.createError(
          rule,
          ERROR_CODE.ERR_TAG_NOT_FOUND,
          `${msgPrnt} required <${tagName}> tag but it doesn't exist`
        )
      );
      return errors;
    }

    // Check max of element in document
    if (max !== -1 && elmLen > max) {
      errors.push(
        this.createError(
          rule,
          ERROR_CODE.ERR_TAG_MAX_EXCEED,
          `The maximum element of <${tagName}> tag is ${max} but this HTML document has ${elmLen} <${tagName}> tags.`
        )
      );
    }

    // Check min of element in document
    if (min !== 0 && elmLen < min) {
      errors.push(
        this.createError(
          rule,
          ERROR_CODE.ERR_TAG_MIN_UNDER,
          `The minimum element of <${tagName}> tag is ${min} but this HTML document has ${elmLen} <${tagName}> tags.`
        )
      );
    }

    // Check attributes (Each attr has 2 prop. Ex: { required, value })
    if (!_.isEmpty(attrs)) {
      const attrErrors = this.validateAttrs(rule, $);
      errors = errors.concat(attrErrors);
    }

    // Recursive with childs element
    if (rule.childs.length > 0) {
      errors = rule.childs.reduce(
        (_errs, rule) =>
          _errs.concat(
            this.validateRule(
              {
                rule: this.createTagRule(null, rule, 'head'),
                $
              },
              errors
            )
          ),
        []
      );
    }
    return errors;
  }

  /**
   * Validate Attributes of each element
   *    1. Check attr required or not
   *    2. Check attr required & attr has specified value
   *
   * @param {TagRule} rule
   * @param {*} $ DOMElement wrapped by cheerio object
   */
  validateAttrs(rule, $) {
    const { attrs, parent } = rule;
    const elmLen = $.length;
    const attrNames = Object.keys(attrs);
    const attrMap = {};
    let attrErrors = [];

    if (elmLen === 0)
      return attrNames.map(attrNm =>
        this.createError(
          rule,
          ERROR_CODE.ERR_TAG_NOT_FOUND,
          `<${rule.tagName} ${attrNm}='${attrs[attrNm].value ||
            ''}'> was not found in ${
            parent ? '<' + parent + '> tag' : 'HTML document'
          }`
        )
      );

    $.each((_, elm) => {
      // Loop each element and check attrs in each one.
      attrNames.forEach(attrNm => {
        const { value } = attrs[attrNm];
        if (!attrMap.hasOwnProperty(attrNm)) {
          // present stands for number of element that contains attr, matched stands for number of attr mached value
          attrMap[attrNm] = { present: 0, matched: 0 };
        }
        const attrVal = elm.attribs[attrNm];
        if (attrVal) {
          attrMap[attrNm].present += 1;
          if (attrVal == value && value) {
            attrMap[attrNm].matched += 1;
          }
        }
      });
    });

    attrNames.forEach(attrNm => {
      const { present, matched } = attrMap[attrNm];
      const attr = attrs[attrNm];
      if (attr.required) {
        const notPresent = elmLen - present;
        if (notPresent > 0) {
          attrErrors.push(
            this.createError(
              rule,
              ERROR_CODE.ERR_ATTR_NOT_FOUND,
              `There are ${notPresent} <${
                rule.tagName
              }> tags without [${attrNm}] attribute`
            )
          );
        }
      }

      if (attr.value) {
        const notMatched = elmLen - matched;
        if (
          notMatched > 0 &&
          notMatched < elmLen &&
          matched < (attr.min || 0)
        ) {
          let errMsg = `At least ${attr.min} <${
            rule.tagName
          }> tags must have attribute [${attrNm}='${
            attr.value
          }']. Need more ${attr.min - matched} <${rule.tagName} ${attrNm}='${
            attr.value
          }'> tags.`;
          attrErrors.push(
            this.createError(rule, ERROR_CODE.ERR_ATTR_NOT_EQUAL, errMsg)
          );
        }

        if (notMatched === elmLen) {
          attrErrors.push(
            this.createError(
              rule,
              ERROR_CODE.ERR_ATTR_NOT_EQUAL,
              `${parent ? '<' + parent + '> tag' : 'HTML'} required <${
                rule.tagName
              }> tag present with attribute [${attrNm}='${
                attr.value
              }'] but no one is valid`
            )
          );
        }
      }
    });

    return attrErrors;
  }

  /**
   * Linting html or page by rules configuration
   *
   * @param { uri, html, file, rules}
   *    Options required uri | html | file && rules && output
   *    output is an object that has 2 props: { type, path }
   *      output.type must be either of [console, file]
   *      output.path required when output.type equals to file and file is a path
   */
  async lint({
    uri,
    html,
    file,
    rules,
    output = { type: 'console', silence: false }
  }) {
    // Make sure that every argument present correctly
    if (!uri && !html && !file)
      throw new Error(
        'You must provide either uri, html, file or readable stream for linting.'
      );
    if (rules) {
      this.initRules(rules);
    }

    // create cheerio instance based on html content or loading from uri
    let $;
    if (uri) {
      $ = await loadUrl(uri);
    } else if (html) {
      $ = await loadHTML(html);
    } else if (file) {
      $ = await loadFile(file);
    }

    // assign cheerio element object for reach rule.
    this.assignElement($);

    // Get all tags in rules configurations and validate each one.
    this.errors = this.tags.reduce(
      (errors, tag) => errors.concat(this.validate(tag)),
      []
    );

    // If there is any invalid term, the errors size will be greater than 0
    if (this.errors.length === 0) return this.errors;

    return this.writeOut(output);
  }

  /**
   * Write result to stdout or file
   *
   * @param {Object} output -> { type, file }
   */
  async writeOut(output) {
    if (output) {
      const { type, silence } = output;
      let file = null;
      if (['console', 'file'].indexOf(type) === -1)
        throw new Error(
          `Output type [${type}] is not valid. Accepted output are [console, file]`
        );

      if (type === 'console') {
        if (!silence) this.printErrors();
        return this.errors;
      }

      if (type === 'file' && !output.path) {
        throw new Error('Provied path must be correct and existed');
      }

      if (typeof output.path === 'string') {
        file = fs.createWriteStream(output.path);
      } else {
        file = output.path;
      }

      const textToWrite = this.toOutputString();

      return new Promise((resolve, reject) => {
        file.once('open', () => {
          file.write(new Buffer(textToWrite, 'utf8'));
          file.end();
        });

        file.on('finish', () => {
          resolve(this.errors);
        });
      });
    }
  }

  /**
   * Create result string with line by line style
   *
   * @returns {string}
   */
  toOutputString() {
    let str = '';
    let i = 0;
    this.errors.forEach(({ code, message }) => {
      str += `[${++i}][${code}] ${message}\n`;
    });
    return str;
  }

  /**
   * Show result string in console
   *
   */
  printErrors() {
    console.log(this.toOutputString());
  }
}

module.exports = SEOLinter;
