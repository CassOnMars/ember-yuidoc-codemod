'use strict';

const fs       = require("fs");

module.exports = transform;

function transform(file, api) {
  const j = api.jscodeshift;
  let path = file.path.split('/');
  let classname = path[path.length - 1].split('.')[0].split('-').map(w => capitalize(w)).join('');

  let source = file.source;

  source = j(source)
    .find(j.ExportDefaultDeclaration)
    .forEach(d => {
      if (!d.node.declaration.callee) {
        // TODO: handle POJO exports
      } else {
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
        d.node.declaration.arguments.forEach(arg => {
          if (arg.type && arg.type == 'ObjectExpression') {
            arg.properties.forEach(p => {
              if (p.key.name == "actions" && p.value.type == "ObjectExpression") {
                p.value.properties.forEach(a => handleProperties(a, j, source));
              } else {
                handleProperties(p, j, source);
              }
            });
          }
        });
      }
    })
    .toSource();

  return source;
}

function capitalize(name) {
  return name.slice(0, 1).toUpperCase() + name.slice(1);
}

function determineCallType(p, j, source) {
  const line = source.split("\n")[p.value.loc.start.line - 1];
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
  } else if (line.includes("Ember.computed")) {
    return retrieveFunctionReturnTypes((p.value.arguments == 0 ? p.value.callee.object.arguments : p.value.arguments).find(f => f.type == 'FunctionExpression')).join('|');
  } else if (line.includes("DS.belongsTo")) {
    return "object";
  } else if (line.includes("DS.attr")) {
    return p.value.arguments.length > 0 ? p.value.arguments[0].value : "object";
  } else if (line.includes("Ember.inject.service")) {
    return p.value.arguments.length > 0 ? p.value.arguments[0].value : p.key.name;
  } else if (line.includes("DS.hasMany")) {
    return "object[]";
  } else if (line.includes("Ember.inject.controller")) {
    return "Ember.Controller";
  } else {
    return "*unknown*";
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

function handleProperties(p, j, source) {
  if (p.value.type == "Literal") {
    const comment = j.commentBlock(
      "*\n* @property " + p.key.name + "\n* @type {" + capitalize(typeof p.value.value) + "}\n",
      true,
      false
    );
    const comments = (p.comments = p.comments || []);
    if (!p.comments.find(c => c.value.includes("@property"))) {
      comments.push(comment);
    }
  } else if (p.value.type == "CallExpression") {
    const comment = j.commentBlock(
      "*\n* @property " +
        p.key.name +
        determineReadOnly(source.split("\n")[p.value.loc.start.line - 1]) +
        "\n* @type {" +
        capitalize(determineCallType(p, j, source)) +
        "}\n",
      true,
      false
    );
    const comments = (p.comments = p.comments || []);
    if (!p.comments.find(c => c.value.includes("@property"))) {
      comments.push(comment);
    }
  } else if (p.value.type == "FunctionExpression") {
    handleFunctionExpression(p, p.value, j, source);
  }
}

function handleFunctionExpression(p, f, j, source) {
  let types = retrieveFunctionReturnTypes(f);
  let params = f.params.map(param => "\n* @param {Object} " + param.name).join('');

  if (types.length > 0) {
    const comment = j.commentBlock("*\n* @method " + p.key.name + params + "\n* @return {" + types.join("|") + "}\n", true, false);
    const comments = (p.comments = p.comments || []);
    if (!p.comments.find(c => c.value.includes("@method"))) {
      comments.push(comment);
    }
  } else {
    const comment = j.commentBlock("*\n* @method " + p.key.name + params + "\n", true, false);
    const comments = (p.comments = p.comments || []);
    if (!p.comments.find(c => c.value.includes("@method"))) {
      comments.push(comment);
    }
  }
}

function retrieveFunctionReturnTypes(f) {
  const returns = f.body.body.filter(b => b.type == "ReturnStatement");
  let types = [];
  returns.forEach(r => {
    const type = capitalize(typeof r.argument.value);
    if (!types.includes(type)) {
      types.push(type);
    }
  });

  return types;
}
