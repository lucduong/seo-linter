'use strict';

const fs = require('fs');
const path = require('path');
const { expect, assert } = require('chai');

const { SEOLinter, loadYamlConfig } = require('../src/index');

describe('# SEOLinter', () => {
  describe('## YAML loader', () => {
    it('Should load yaml configuration file correctly when provide correct path', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          assert(cfg, 'Should not be null or empty');
          done();
        })
        .catch(err => done(err));
    });

    it('Should throw error when the configuration path does not exist', done => {
      loadYamlConfig('/path/to/any/file.yml')
        .then(() => {
          done(
            new Error(
              'The configuration file does not exist but still load successfully'
            )
          );
        })
        .catch(() => done());
    });
  });

  describe('## Linter', () => {
    it('Should create SEOLinter instance correctly without error', done => {
      const linter = new SEOLinter({ rules: { strong: { required: true } } });
      assert(linter, 'Should not be null or empty');
      done();
    });

    it('Should throw error when create new SEOLinter instance without `rules` argument', done => {
      try {
        const linter = new SEOLinter();
        done(
          new Error(
            'Should not creating new instance without `rules` argument.'
          )
        );
      } catch (error) {
        done();
      }
    });

    it('Should throw error if linting without either of [uri, html, file]', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({})
            .then(() => {
              done(
                new Error(
                  'Should not linting without any providing HTML document'
                )
              );
            })
            .catch(() => done());
        })
        .catch(err => done());
    });

    it('Should throw error if provide output.type=file but not providing output.path', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: '',
              output: {
                type: 'file'
              }
            })
            .then(errors => {
              done(
                new Error(
                  'Still linting when provide output[file] without path'
                )
              );
            })
            .catch(err => done());
        })
        .catch(err => done(err));
    });

    it('Should return empty array when provide valid HTML document', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: `
                <html>
                  <head>
                    <title>LTV</title>
                    <meta name="description" content="Anything">
                    <meta name="keywords" content="ltv,software">
                  </head>
                  <body>
                    <img alt="Alt" src="img.jpg">
                    <strong><a href="https://ltv.vn">LTV</a></strong>
                  </body>
                </html>
              `,
              output: { silence: true }
            })
            .then(errors => {
              expect(errors).to.be.an('array').and.be.empty;
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Provide HTML document without [head, img, h1] and configuration required all, should return errors ', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: `
                <html>
                </html>
              `
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(3);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Should write to file if provide output file', done => {
      const cfgPath = path.resolve('config.yml');
      const outputPath = path.resolve('lint-report.txt');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: '<html></html',
              output: {
                type: 'file',
                path: outputPath
              }
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(3);
              const isExisted = fs.existsSync(outputPath);
              assert(isExisted, `Report should be writen in ${outputPath}`);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });
  });
});
