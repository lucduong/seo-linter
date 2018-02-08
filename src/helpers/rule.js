/**
 * TagRule
 *
 * max { -1 => Unlimited }
 * min { 0 => No required min }
 */
class TagRule {
  constructor(
    tagName,
    { parent, required = false, max = -1, min = 0, attrs = {}, childs = [] }
  ) {
    if (!tagName) throw new Error('tagName is required');
    this._tagName = tagName;
    this.parent = parent;
    this.required = required || false;
    this.max = max || -1;
    this.min = min || 0;
    this.attrs = attrs || {};
    this.childs = childs || [];
  }

  get tagName() {
    return this._tagName;
  }
}

module.exports = TagRule;
