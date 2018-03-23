'use strict';

const fs       = require("fs");

const LOG_FILE = "ember-yuidoc-codemod.tmp." + process.pid;
const ERROR_WARNING = 1;
const MISSING_GLOBAL_WARNING = 2;

const OPTS = {
  quote: 'single'
};


module.exports = transform;

function transform(file, api) {
  const j = api.jscodeshift;
  let path = file.path.split('/');
  let classname = path[path.length - 1].split('.')[0].split('-').map(w => capitalize(w)).join('');
  let source = j(file.source)
    .find(j.ExportDefaultDeclaration)
    .forEach(d => {
      const comments = (d.node.comments = d.node.comments || []);
      if (!d.node.comments.find(c => c.value.includes("@class"))) {
        comments.push(
          j.commentBlock(
            "*\n* @module " +
              d.node.declaration.callee.object.property.name.toLowerCase() +
              "s\n* @extends " +
              d.node.declaration.callee.object.object.name +
              "." +
              d.node.declaration.callee.object.property.name +
              "\n* @class " +
              classname +
              "\n",
            true,
            false
          )
        );
      }
    })
    .toSource();

  source = j(source)
    .find(j.Property)
    .forEach(p => {
      if (p.node.value.type == "Literal") {
        const comment = j.commentBlock(
          "*\n* @property " + p.node.key.name + "\n* @type {" + capitalize(typeof p.node.value.value) + "}\n",
          true,
          false
        );
        const comments = (p.node.comments = p.node.comments || []);
        if (!p.node.comments.find(c => c.value.includes("@property"))) {
          comments.push(comment);
        }
      } else if (p.node.value.type == "CallExpression") {
        const comment = j.commentBlock(
          "*\n* @property " +
            p.node.key.name +
            determineReadOnly(source.split("\n")[p.node.value.loc.start.line - 1]) +
            "\n* @type {" +
            capitalize(determineCallType(source.split("\n")[p.node.value.loc.start.line - 1])) +
            "}\n",
          true,
          false
        );
        const comments = (p.node.comments = p.node.comments || []);
        if (!p.node.comments.find(c => c.value.includes("@property"))) {
          comments.push(comment);
        }
      } else if (p.node.value.type == "FunctionExpression") {
        const returns = p.node.value.body.body.filter(b => b.type == "ReturnStatement");
        let types = [];
        returns.forEach(r => {
          const type = capitalize(typeof r.argument.value);
          if (!types.includes(type)) {
            types.push(type);
          }
        });
        if (returns.length > 0) {
          const comment = j.commentBlock("*\n* @method " + p.node.key.name + "\n* @return {" + types.join("|") + "}\n", true, false);
          const comments = (p.node.comments = p.node.comments || []);
          if (!p.node.comments.find(c => c.value.includes("@method"))) {
            comments.push(comment);
          }
        } else {
          const comment = j.commentBlock("*\n* @method " + p.node.key.name + "\n", true, false);
          const comments = (p.node.comments = p.node.comments || []);
          if (!p.node.comments.find(c => c.value.includes("@method"))) {
            comments.push(comment);
          }
        }
      }
    })
    .toSource();

  return source;
}

function capitalize(name) {
  return name.slice(0, 1).toUpperCase() + name.slice(1);
}

function determineCallType(line) {
  if (line.includes("Ember.computed.")) {
    switch (line.split("Ember.computed.")[1].split("(")[0]) {
      case "alias":
      case "collect":
      case "deprecatingAlias":
      case "filter":
      case "filterBy":
      case "intersect":
      case "map":
      case "mapBy":
      case "oneWay":
      case "readOnly":
      case "reads":
      case "setDiff":
      case "sort":
      case "union":
      case "uniq":
      case "uniqBy":
        return "TODO"; // TODO: Navigate the property and determine type.
      case "max":
      case "min":
      case "sum":
        return "number";
      case "and":
      case "bool":
      case "empty":
      case "equal":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
      case "match":
      case "none":
      case "not":
      case "notEmpty":
      case "or":
        return "boolean";
    }
  }
}

function determineReadOnly(line) {
  if (line.includes("Ember.computed.")) {
    switch (line.split("Ember.computed.")[1].split("(")[0]) {
      case "collect":
      case "filter":
      case "filterBy":
      case "intersect":
      case "map":
      case "mapBy":
      case "readOnly":
      case "reads":
      case "setDiff":
      case "sort":
      case "union":
      case "uniq":
      case "uniqBy":
      case "max":
      case "min":
      case "sum":
      case "and":
      case "bool":
      case "empty":
      case "equal":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
      case "match":
      case "none":
      case "not":
      case "notEmpty":
      case "or":
        return "\n* @readOnly";
    }
  }

  return "";
}
