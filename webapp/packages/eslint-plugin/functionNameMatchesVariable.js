/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

function calleeName(node) {
  if (node.type === 'Identifier') {
    return node.name;
  }

  if (node.type === 'MemberExpression' && !node.computed && node.object.type === 'Identifier' && node.property.type === 'Identifier') {
    return `${node.object.name}.${node.property.name}`;
  }

  return null;
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a named function expression to match its const binding, including React component wrappers.',
    },
    schema: [],
    messages: {
      nameMismatch: 'Function "{{functionName}}" must have the same name as const "{{variableName}}".',
    },
  },
  create: function create(context) {
    const wrapperNames = new Set(['observer', 'memo', 'forwardRef']);
    const wrappers = new Set([...wrapperNames, 'React.memo', 'React.forwardRef']);
    const expressionTypes = new Set([
      'TSAsExpression',
      'TSTypeAssertion',
      'TSNonNullExpression',
      'TSSatisfiesExpression',
      'TSInstantiationExpression',
    ]);

    for (const node of context.sourceCode.ast.body) {
      if (node.type !== 'ImportDeclaration') {
        continue;
      }

      const source = node.source.value;

      if (!['react', 'mobx-react', 'mobx-react-lite'].includes(source)) {
        continue;
      }

      for (const specifier of node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          if (wrapperNames.has(specifier.imported.name)) {
            wrappers.add(specifier.local.name);
          }
        } else {
          const names = source === 'react' ? ['memo', 'forwardRef'] : ['observer'];

          for (const name of names) {
            wrappers.add(`${specifier.local.name}.${name}`);
          }
        }
      }
    }

    return {
      FunctionExpression(node) {
        if (!node.id) {
          return;
        }

        let expression = node;

        while (expression.parent) {
          const parent = expression.parent;

          if (expressionTypes.has(parent.type) && parent.expression === expression) {
            expression = parent;
          } else if (parent.type === 'CallExpression' && parent.arguments[0] === expression && wrappers.has(calleeName(parent.callee))) {
            expression = parent;
          } else {
            break;
          }
        }

        const declaration = expression.parent;

        if (
          declaration?.type !== 'VariableDeclarator' ||
          declaration.init !== expression ||
          declaration.id.type !== 'Identifier' ||
          declaration.parent.kind !== 'const' ||
          declaration.id.name === node.id.name
        ) {
          return;
        }

        context.report({
          node: node.id,
          messageId: 'nameMismatch',
          data: { functionName: node.id.name, variableName: declaration.id.name },
        });
      },
    };
  },
};
