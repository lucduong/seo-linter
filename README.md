# seo-linter

SEO Lint - The package for linting your HTML file with Google SEO

[![Build Status](https://travis-ci.org/lucduong/seo-lint.svg?branch=master)](https://travis-ci.org/lucduong/seo-lint)
[![Coverage Status](https://coveralls.io/repos/github/lucduong/seo-lint/badge.svg?branch=master)](https://coveralls.io/github/lucduong/seo-lint?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/seo-linter.svg)](https://badge.fury.io/js/seo-linter)

## Installation

SEOLinter requires node version 8.9.1 LTS or greater. We highly recommend [nvm](https://github.com/creationix/nvm) for installing node.
Once you have node/npm, you can install/upgrade SEOLinter globally with the following command:

```bash
yarn add seo-linter
```

## Usage

### Command Line

To run SEOLint you need to provide configuration file and either html, uri, file

Read more about [configuration file](https://github.com/lucduong/seo-linter/#configs):

```bash
seolint -c /path/to/config.yml -u https://google.com
```

To see the full usage information:

```bash
seolint --help
```

### Use in your code

Read more about [configuration file](https://github.com/lucduong/seo-linter/#configs):

Import SEOLinter first

```js
const { SEOLinter } = require('seo-linter');
```

Create new Linter instance and using

```js
const linter = new SEOLinter({ rules: { strong: { required: true } } });
linter.lint({ uri: 'https://google.com' }).then(errors => {
  // errors is an array which has format [{ code, message, tagName }]
});
```

If you want to use configuration file, you can use `loadYamlConfig` function or loading by yourself

```js
const { SEOLinter, loadYamlConfig } = require('seo-linter');

loadYamlConfig('./config.yml')
  .then(cfg => {
    // After getting cfg, you able to using use SEOLinter
    // cfg must has format: { rules }
    const linter = new SEOLinter(cfg);
    linter.lint({ uri: 'https://google.com' }).then(errors => {
      // errors is an array which has format [{ code, message, tagName }]
    });
  })
  .catch(err => console.log);
```

## Configs

One config rule should has either of [required, max, min, attrs, childs]

* `required`: require tag present in HTML document or parent tag
* `max`: The maximum tag allow in HTML document - default is `-1` (Unlimited)
* `min`: The minimum tag allow in HTML document - default is `0`
* `attrs`: Should has format { [attrName]: { required, value, min }}
* `childs`: List of config rule

Here is the sample of configuration

```yaml
rules:
  strong:
    max: 15 # <strong> tag can be present or not but if present shouldn't greater than 15 elements
  h1:
    max: 1 # If <h1> present, there is only 1 element is accepted
  img: # <img> tag has 2 configs
    -
      required: true
      attrs: # require <img> tag has attribute alt (the value of attribute can be any)
        alt:
          required: true
    -
      attrs:
        src:
          required: true
  a: # require <a> tag is present
    required: true
  head:
    required: true # require <head> tag is present
    childs: # inside of <head> tag has others config rule
      - title:
          required: true # <title> is required
      - meta:
          attrs:
            name:
              value: 'description' # At least 1 <meta> tag with attribute 'description' must be present
              min: 1 # If min is not set, require all <meta> tag with attribute 'description' present
      - meta:
          attrs:
            name:
              value: 'keywords'
              min: 1
```

## LICENSE

Package release under MIT license.
