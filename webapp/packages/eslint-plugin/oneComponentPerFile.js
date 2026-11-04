/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

function isFunction(node) {
  return ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type);
}

function unwrap(node) {
  while (node && ['TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(node.type)) {
    node = node.expression;
  }

  return node;
}

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
      description: 'Require each React component implementation to have its own file.',
      url: 'https://github.com/dbeaver/cloudbeaver/blob/devel/.agents/skills/component-composition/SKILL.md',
    },
    schema: [],
    messages: {
      multipleComponents:
        'Move component "{{name}}" to its own file. See the component-composition skill (.agents/skills/component-composition/SKILL.md).',
    },
  },
  create: function create(context) {
    if (/\.(?:test|spec|stories)\.[cm]?[jt]sx?$/.test(context.filename)) {
      return {};
    }

    const components = [];
    const wrappers = new Set(['observer', 'memo', 'forwardRef', 'React.memo', 'React.forwardRef']);
    const reactClasses = new Set(['Component', 'PureComponent', 'React.Component', 'React.PureComponent']);
    const elementFactories = new Set(['React.createElement']);
    const { visitorKeys } = context.sourceCode;

    function isRenderValue(node) {
      node = unwrap(node);

      if (!node) {
        return false;
      }

      switch (node.type) {
        case 'JSXElement':
        case 'JSXFragment':
          return true;
        case 'Literal':
          return node.value === null;
        case 'ConditionalExpression':
          return isRenderValue(node.consequent) || isRenderValue(node.alternate);
        case 'LogicalExpression':
          return isRenderValue(node.left) || isRenderValue(node.right);
        case 'ArrayExpression':
          return node.elements.some(isRenderValue);
        case 'CallExpression':
          return elementFactories.has(calleeName(node.callee));
        default:
          return false;
      }
    }

    function hasRenderReturn(node) {
      if (!node || isFunction(node) || node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
        return false;
      }

      if (node.type === 'ReturnStatement') {
        return isRenderValue(node.argument);
      }

      return (visitorKeys[node.type] ?? []).some(key => {
        const child = node[key];
        return Array.isArray(child) ? child.some(hasRenderReturn) : hasRenderReturn(child);
      });
    }

    function getDeclaration(node) {
      let expression = node;
      let wrapped = false;

      while (expression.parent) {
        const parent = expression.parent;

        if (unwrap(parent) === expression) {
          expression = parent;
        } else if (parent.type === 'CallExpression' && parent.arguments[0] === expression && wrappers.has(calleeName(parent.callee))) {
          expression = parent;
          wrapped = true;
        } else {
          break;
        }
      }

      const parent = expression.parent;
      let name = node.id?.name;
      let reportNode = node;

      if (parent?.type === 'VariableDeclarator' && parent.id.type === 'Identifier') {
        name = parent.id.name;
        reportNode = parent.id;
      } else if (parent?.type === 'ExportDefaultDeclaration') {
        return { node: expression, name: name ?? 'default export', wrapped };
      } else if (parent?.type === 'Property' && !parent.computed && parent.key.type === 'Identifier') {
        name = parent.key.name;
        reportNode = parent.key;
      }

      return name && /^[A-Z]/.test(name) ? { node: reportNode, name, wrapped } : null;
    }

    function checkFunction(node) {
      const declaration = getDeclaration(node);

      if (declaration && (declaration.wrapped || isRenderValue(node.body) || hasRenderReturn(node.body))) {
        components.push(declaration);
      }
    }

    function checkClass(node) {
      const declaration = getDeclaration(node);

      if (declaration && node.superClass && reactClasses.has(calleeName(unwrap(node.superClass)))) {
        components.push(declaration);
      }
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value;

        if (!['react', 'mobx-react', 'mobx-react-lite'].includes(source)) {
          return;
        }

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            const imported = specifier.imported.name;

            if (['observer', 'memo', 'forwardRef'].includes(imported)) {
              wrappers.add(specifier.local.name);
            } else if (source === 'react' && ['Component', 'PureComponent'].includes(imported)) {
              reactClasses.add(specifier.local.name);
            } else if (source === 'react' && imported === 'createElement') {
              elementFactories.add(specifier.local.name);
            }
          } else {
            const namespace = specifier.local.name;
            const names = source === 'react' ? ['memo', 'forwardRef'] : ['observer'];

            for (const name of names) {
              wrappers.add(`${namespace}.${name}`);
            }

            if (source === 'react') {
              reactClasses.add(`${namespace}.Component`);
              reactClasses.add(`${namespace}.PureComponent`);
              elementFactories.add(`${namespace}.createElement`);
            }
          }
        }
      },
      'FunctionDeclaration, FunctionExpression, ArrowFunctionExpression': checkFunction,
      'ClassDeclaration, ClassExpression': checkClass,
      'Program:exit'() {
        components.sort((first, second) => first.node.range[0] - second.node.range[0]);

        for (const component of components.slice(1)) {
          context.report({ node: component.node, messageId: 'multipleComponents', data: { name: component.name } });
        }
      },
    };
  },
};
