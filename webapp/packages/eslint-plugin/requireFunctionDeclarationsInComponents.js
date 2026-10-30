/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const COMPONENT_NAME = /^[A-Z]/;

function isFunction(node) {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression';
}

function enclosingFunction(node) {
  let current = node.parent;

  while (current) {
    if (isFunction(current)) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

function nameOf(fn) {
  if (fn.id?.type === 'Identifier') {
    return fn.id.name;
  }

  let parent = fn.parent;

  while (parent?.type === 'CallExpression') {
    parent = parent.parent;
  }

  return parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier' ? parent.id.name : null;
}

function hasLexicalBindings(node, visitorKeys) {
  if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
    return false;
  }

  if (
    node.type === 'ThisExpression' ||
    node.type === 'Super' ||
    (node.type === 'Identifier' && node.name === 'arguments') ||
    (node.type === 'MetaProperty' && node.meta.name === 'new')
  ) {
    return true;
  }

  return (visitorKeys[node.type] ?? []).some(key => {
    const child = node[key];

    return Array.isArray(child) ? child.some(node => node && hasLexicalBindings(node, visitorKeys)) : child && hasLexicalBindings(child, visitorKeys);
  });
}

export default {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Require functions declared inside React components to be function declarations instead of const arrows or function expressions.',
    },
    schema: [],
    messages: {
      requireDeclaration: 'Declare `{{name}}` inside `{{componentName}}` as `function {{name}}() {}`, not as a `const` holding a function.',
    },
  },
  create(context) {
    const filename = context.filename ?? '';

    if (!filename.endsWith('.tsx') || filename.includes('.generated.') || filename.includes('.gen.')) {
      return {};
    }

    const { sourceCode } = context;
    const newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n';

    return {
      VariableDeclarator(node) {
        const { id, init } = node;
        const declaration = node.parent;

        if (!init || (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression')) {
          return;
        }

        if (declaration.type !== 'VariableDeclaration' || declaration.kind !== 'const' || id.type !== 'Identifier') {
          return;
        }

        const component = enclosingFunction(node);
        const componentName = component === null ? null : nameOf(component);

        if (componentName === null || !COMPONENT_NAME.test(componentName)) {
          return;
        }

        const report = { node, messageId: 'requireDeclaration', data: { name: id.name, componentName } };
        const comments = sourceCode.getCommentsInside(declaration);
        const fixable =
          declaration.declarations.length === 1 &&
          !id.typeAnnotation &&
          !init.generator &&
          init.body &&
          declaration.parent.type !== 'ForStatement' &&
          (!init.id || init.id.name === id.name) &&
          !comments.some(comment => comment.range[0] < init.body.range[0] || comment.range[1] > init.body.range[1]) &&
          (init.type !== 'ArrowFunctionExpression' || !hasLexicalBindings(init, sourceCode.visitorKeys));

        if (!fixable) {
          context.report(report);

          return;
        }

        context.report({
          ...report,
          fix(fixer) {
            const asyncPrefix = init.async ? 'async ' : '';
            const typeParameters = init.typeParameters ? sourceCode.getText(init.typeParameters) : '';
            const parameters = init.params.map(parameter => sourceCode.getText(parameter)).join(', ');
            const returnType = init.returnType ? sourceCode.getText(init.returnType) : '';
            const indentation = sourceCode.lines[declaration.loc.start.line - 1].match(/^\s*/)[0];
            const body =
              init.body.type === 'BlockStatement'
                ? sourceCode.getText(init.body)
                : `{${newline}${indentation}  return ${sourceCode.getText(init.body)};${newline}${indentation}}`;

            return fixer.replaceText(declaration, `${asyncPrefix}function ${id.name}${typeParameters}(${parameters})${returnType} ${body}`);
          },
        });
      },
    };
  },
};
