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

    it('Should use default configuration if not providing filename', done => {
      loadYamlConfig()
        .then(cfg => {
          assert(cfg, 'Should not be null or empty');
          done();
        })
        .catch(err => done(err));
    });

    it('Should load correct configuration if provide config name', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath, 'rules')
        .then(cfg => {
          assert(cfg, 'Should not be null or empty');
          done();
        })
        .catch(err => done(err));
    });

    it('Should throw error if provide config name but it doesnt exist', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath, 'x')
        .then(cfg => {
          done(new Error('Configuration does not exist but still loading'));
        })
        .catch(err => done());
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

    it('Should throw error when create new SEOLinter instance with rules is null or undefined', done => {
      try {
        const linter = new SEOLinter({ rules: null });
        done(
          new Error(
            'Should not creating new instance with `rules` argument is null.'
          )
        );
      } catch (error) {
        done();
      }
    });

    it('Should throw error when create new SEOLinter instance with rules is not an object', done => {
      try {
        const linter = new SEOLinter({ rules: 1 });
        done(
          new Error(
            'Should not creating new instance with `rules` argument is not an object.'
          )
        );
      } catch (error) {
        done();
      }
    });

    it('Should throw error when create new SEOLinter instance with rules is empty', done => {
      try {
        const linter = new SEOLinter({ rules: {} });
        done();
      } catch (error) {
        done(error);
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
              output: { type: 'console', silence: false }
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
              `,
              output: {
                type: 'console',
                silence: true
              }
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(4);
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
                .has.length(4);
              const isExisted = fs.existsSync(outputPath);
              assert(isExisted, `Report should be writen in ${outputPath}`);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Should show console without error', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: `
                <html>
                </html>
              `,
              output: {
                type: 'console'
              }
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(4);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Should throw error if provide output type is invalid', done => {
      const seo = new SEOLinter({ rules: { strong: { required: true } } });
      seo
        .lint({
          html: `
                <html>
                </html>
              `,
          output: {
            type: 'x'
          }
        })
        .then(errors => {
          done(
            new Error('Providing invalid type but still runing without error')
          );
        })
        .catch(err => done());
    });

    it('Should run correctly when provide nodejs writable stream', done => {
      const cfgPath = path.resolve('config.yml');
      const outputPath = path.resolve('lint-report.txt');
      const file = fs.createWriteStream(outputPath);
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: '<html></html',
              output: {
                type: 'file',
                path: file
              }
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(4);
              const isExisted = fs.existsSync(outputPath);
              assert(isExisted, `Report should be writen in ${outputPath}`);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Should run correctly with provide new rules when linting', done => {
      const cfgPath = path.resolve('config.yml');
      loadYamlConfig(cfgPath)
        .then(cfg => {
          const seo = new SEOLinter(cfg);
          seo
            .lint({
              html: `
                <html>
                </html>
              `,
              output: {
                type: 'console',
                silence: true
              },
              ...cfg
            })
            .then(errors => {
              expect(errors)
                .to.be.an('array')
                .has.length(4);
              done();
            })
            .catch(err => done(err));
        })
        .catch(err => done(err));
    });

    it('Should show error if provide rules required but not existing in document', done => {
      const seo = new SEOLinter({ rules: { strong: { required: true } } });
      const tagName = 'strong';
      seo
        .lint({
          html: `
                <html>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `HTML document required <${tagName}> tag but it doesn't exist`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules required in tag', done => {
      const seo = new SEOLinter({
        rules: { head: { childs: [{ meta: { required: true } }] } }
      });
      const tagName = 'meta';
      seo
        .lint({
          html: `
                <html>
                  <head></head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `<head> tag required <${tagName}> tag but it doesn't exist`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules with attribute required in tag', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [{ meta: { attrs: { name: { value: 'description' } } } }]
          }
        }
      });
      const tagName = 'head';
      seo
        .lint({
          html: `
                <html>
                  <head></head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `<meta name='description'> was not found in <${tagName}> tag`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules with `required at least 2 tags present with attribute`', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [
              { meta: { attrs: { name: { value: 'description', min: 2 } } } }
            ]
          }
        }
      });
      const tagName = 'meta';
      seo
        .lint({
          html: `
                <html>
                  <head>
                    <meta name='description', conent='LTV'>
                  </head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('ATTR002');
          expect(errors[0].message).to.eq(
            `At least 2 <${tagName}> tags must have attribute [name='description']. Need more 1 <meta name='description'> tags.`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag require attribute present', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [{ meta: { attrs: { name: { required: true } } } }]
          }
        }
      });
      const tagName = 'meta';
      seo
        .lint({
          html: `
                <html>
                  <head>
                    <meta content=''>
                  </head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('ATTR001');
          expect(errors[0].message).to.eq(
            `There are 1 <${tagName}> tags without [name] attribute`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag require attribute present with value', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [{ meta: { attrs: { name: { value: 'description' } } } }]
          }
        }
      });
      const tagName = 'meta';
      seo
        .lint({
          html: `
                <html>
                  <head>
                    <meta name='description'>
                    <meta name='X'>
                  </head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag require attribute present but no element present', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [{ meta: { attrs: { name: { value: 'description' } } } }]
          }
        }
      });
      const tagName = 'meta';
      seo
        .lint({
          html: `
                <html>
                  <head>
                    <meta name='Y'>
                    <meta name='X'>
                  </head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag require attribute present but there is no available element in doc', done => {
      const seo = new SEOLinter({
        rules: {
          head: {
            childs: [{ meta: { attrs: { name: { required: true } } } }]
          }
        }
      });
      const tagName = 'head';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `<meta name=''> was not found in <${tagName}> tag`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag with maximum exceed', done => {
      const seo = new SEOLinter({
        rules: {
          strong: { max: 2 }
        }
      });
      const tagName = 'strong';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                  <body>
                    <strong>1</strong>
                    <strong>2</strong>
                    <strong>3</strong>
                  </body>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG002');
          expect(errors[0].message).to.eq(
            `The maximum element of <${tagName}> tag is 2 but this HTML document has 3 <${tagName}> tags.`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag with minimum under', done => {
      const seo = new SEOLinter({
        rules: {
          strong: { min: 5 }
        }
      });
      const tagName = 'strong';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                  <body>
                    <strong>1</strong>
                    <strong>2</strong>
                    <strong>3</strong>
                  </body>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG003');
          expect(errors[0].message).to.eq(
            `The minimum element of <${tagName}> tag is 5 but this HTML document has 3 <${tagName}> tags.`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag required in HTML', done => {
      const seo = new SEOLinter({
        rules: {
          strong: { required: true }
        }
      });
      const tagName = 'strong';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                  <body>
                  </body>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `HTML document required <${tagName}> tag but it doesn't exist`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag required in HTML', done => {
      const seo = new SEOLinter({
        rules: {
          div: { childs: [{ strong: { required: true } }] }
        }
      });
      const tagName = 'strong';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                  <body>
                    <div></div>
                  </body>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('TAG001');
          expect(errors[0].message).to.eq(
            `<div> tag required <${tagName}> tag but it doesn't exist`
          );
          done();
        })
        .catch(err => done(err));
    });

    it('Should show correct error message if provide rules tag required attribute equals to "LTV" in HTML', done => {
      const seo = new SEOLinter({
        rules: {
          img: { attrs: { alt: { value: 'LTV' } } }
        }
      });
      const tagName = 'img';
      seo
        .lint({
          html: `
                <html>
                  <head>
                  </head>
                  <body>
                    <img alt="XXX">
                  </body>
                </html>
              `,
          output: {
            type: 'console'
          }
        })
        .then(errors => {
          expect(errors)
            .to.be.an('array')
            .and.length(1);
          expect(errors[0].code).to.eq('ATTR002');
          expect(errors[0].message).to.eq(
            `HTML required <${tagName}> tag present with attribute [alt='LTV'] but no one is valid`
          );
          done();
        })
        .catch(err => done(err));
    });
  });
});
