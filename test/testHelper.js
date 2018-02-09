'use strict';

const fs = require('fs');
const path = require('path');
const { expect, assert } = require('chai');

const {
  SEOLinter,
  TagRule,
  loadFile,
  loadUrl,
  loadHTML
} = require('../src/helpers');

const sampleHTML = `<!DOCTYPE html><html lang="en">
<head><title> </title><!-- General META--><meta charset="utf-8"><meta http-equiv="Content-type"         content="text/html;charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"><meta name="viewport"                  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"><meta meta name="viewport" content="width=device-  width"><!-- Semantic META--><meta name="keywords" content="ltv, coffee, webapp"><meta name="description" content="LTV Coffee - A       Project for making everything easier"><!-- Facebook META--><!--meta(property='fb:app_id', content=facebookAppId)--><meta property="og: site_name" content="LTV Coffee - A Project for making everything easier"><meta property="og:title"><meta property="og:description"     content="LTV Coffee - A Project for making everything easier"><meta property="og:url" content="https://ltv.vn/"><meta property="og:    image" content="/app/images/logo.png"><meta property="og:type" content="website"><!-- Twitter META--><meta name="twitter:title"        content="LTV Coffee - A Project for making everything easier"><meta name="twitter:description" content="LTV Coffee - A Project for     making everything easier"><meta name="twitter:url" content="https://ltv.vn/"><meta name="twitter:image" content="/app/images/logo.     png"><!-- Favicon and App icon--><link rel="apple-touch-icon" sizes="57x57" href="/app/images/icon/apple-icon-57x57.png"><link         rel="apple-touch-icon" sizes="60x60" href="/app/images/icon/apple-icon-60x60.png"><link rel="apple-touch-icon" sizes="72x72" href="/   app/images/icon/apple-icon-72x72.png"><link rel="apple-touch-icon" sizes="76x76" href="/app/images/icon/apple-icon-76x76.png"><link    rel="apple-touch-icon" sizes="114x114" href="/app/images/icon/apple-icon-114x114.png"><link rel="apple-touch-icon" sizes="120x120"     href="/app/images/icon/apple-icon-120x120.png"><link rel="apple-touch-icon" sizes="144x144" href="/app/images/icon/apple-icon-144x144. png"><link rel="apple-touch-icon" sizes="152x152" href="/app/images/icon/apple-icon-152x152.png"><link rel="apple-touch-icon"          sizes="180x180" href="/app/images/icon/apple-icon-180x180.png"><link rel="icon" type="image/png" sizes="192x192" href="/app/images/    icon/android-icon-192x192.png"><link rel="icon" type="image/png" sizes="32x32" href="/app/images/icon/favicon-32x32.png"><link         rel="icon" type="image/png" sizes="96x96" href="/app/images/icon/favicon-96x96.png"><link rel="icon" type="image/png" sizes="16x16"    href="/app/images/icon/favicon-16x16.png"><link rel="manifest" href="/app/images/icon/manifest.json"><meta name="msapplication-        TileColor" content="#ffffff"><meta name="msapplication-TileImage" content="/app/images/icon/ms-icon-144x144.png"><meta name="theme-    color" content="#ffffff"><!-- Site stylesheet--><link rel="stylesheet" href="/app/styles/frontend.css"></head><body                    class="presentation-page loading"><div id="app"></div><!-- Site scripts--><script src="/app/vendor.js"></script><script src="/app/     frontend.js"></script></body></html>`;

describe('# Helper', () => {
  describe('## loader', () => {
    describe('### loadFile', () => {
      it('Should load HTML file correctly without error', done => {
        const testDir = path.resolve('./', 'test');
        loadFile(path.resolve(testDir, 'ltv.html'))
          .then(() => done())
          .catch(err => done(err));
      });

      it('Should throw error when html file does not exist', done => {
        loadFile('/this/path/does/not/exist.html')
          .then(() => new Error('The file still load even file does not exist'))
          .catch(err => done());
      });

      it('Should return cheerio wrapper object (Wrapped HTML)', done => {
        const testDir = path.resolve('./', 'test');
        loadFile(path.resolve(testDir, 'ltv.html'))
          .then($ => {
            const tagName = $.prop('tagName');
            expect(tagName.toLowerCase()).to.eq('html');
            done();
          })
          .catch(err => done(err));
      });

      it('Should throw error if not providing filename', done => {
        loadFile()
          .then($ => {
            done(new Error('Not providing `filename` but still loading file'));
          })
          .catch(err => done());
      });
    });

    describe('### loadUrl', () => {
      it('Should load HTML from SSL site correctly without error', done => {
        loadUrl('https://ltv.vn')
          .then(() => done())
          .catch(err => done(err));
      });

      it('Should return cheerio wrapper object (Wrapped HTML)', done => {
        loadUrl('https://ltv.vn')
          .then($ => {
            const tagName = $.prop('tagName');
            expect(tagName.toLowerCase()).to.eq('html');
            done();
          })
          .catch(err => done(err));
      });

      it('Should throw error if provide url without startsWith http:// or https://', done => {
        loadUrl('ltv.vn')
          .then(() => {
            done(
              new Error(
                'Provided url without starting with http:// or https:// but still loading'
              )
            );
          })
          .catch(() => done());
      });
    });

    describe('### loadHTML', () => {
      it('Should load HTML from HTML string correctly without error', done => {
        loadHTML(sampleHTML)
          .then(() => done())
          .catch(err => done(err));
      });

      it('Should throw error when HTML string is null or empty', done => {
        const errMsg =
          'The HTML string is null or empty but loader still load html';

        Promise.all([loadHTML(null), loadHTML(''), loadHTML(undefined)])
          .then(() => new Error(errMsg))
          .catch(err => done());
      });

      it('Should return cheerio wrapper object (Wrapped HTML)', done => {
        loadHTML(sampleHTML)
          .then($ => {
            const tagName = $.prop('tagName');
            expect(tagName.toLowerCase()).to.eq('html');
            done();
          })
          .catch(err => done(err));
      });
    });
  });

  describe('## TagRule', () => {
    const tagName = 'img';
    const parent = 'html';
    const required = true;
    const max = 10;
    const min = 0;
    const attrs = { alt: { required: true, value: 'description' } };

    it('Should create new TagRule correctly without error', done => {
      const rule = new TagRule('img', { parent, required, max, min, attrs });
      assert(rule, 'rule should not be null after creating new instance');
      expect(rule.tagName).to.eq(tagName);
      expect(rule.parent).to.eq(parent);
      expect(rule.required).to.eq(required);
      expect(rule.max).to.eq(max);
      expect(rule.min).to.eq(min);
      expect(rule.attrs).to.be.an('object').and.that.is.not.empty;
      expect(rule.attrs).to.deep.equal(attrs);
      done();
    });

    it('Should create new instance of TagRule with default value', done => {
      const rule = new TagRule(tagName, {});
      assert(rule, 'rule should not be null after creating new instance');
      expect(rule.tagName).to.eq(tagName);
      expect(rule.parent).to.eq(undefined);
      expect(rule.required).to.eq(false);
      expect(rule.max).to.eq(-1);
      expect(rule.min).to.eq(0);
      expect(rule.attrs).to.be.an('object').and.empty;
      done();
    });

    it('Should throw error if not providing `tagName` when creating new instance', done => {
      try {
        const rule = new TagRule(null, {});
        done(
          new Error('Not providing `tagName` but still creating new instance.')
        );
      } catch (err) {
        done();
      }
    });

    it('Should throw error if not providing `options` when creating new instance', done => {
      try {
        const rule = new TagRule(tagName);
        done(
          new Error('Not providing `options` but still creating new instance.')
        );
      } catch (err) {
        done();
      }
    });

    it('Should create instance correctly if provide invalid param (Need to set default)', done => {
      const rule = new TagRule(tagName, {
        max: null,
        min: null,
        attrs: null,
        childs: null
      });

      const { max, min, attrs, childs } = rule;
      expect(rule).to.not.empty;
      expect(max).to.eq(-1);
      expect(min).to.eq(0);
      expect(attrs).to.be.empty;
      expect(childs).to.be.empty;
      done();
    });
  });
});
