/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Name service and resource dependencies after their class in camelCase.',
    },
    schema: [],
    messages: {
      incorrectName: 'Name {{serviceName}} instance "{{expectedName}}" instead of "{{actualName}}".',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    function getName(node) {
      if (!node) {
        return null;
      }

      if (node.type === 'Identifier') {
        for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
          const variable = scope.set.get(node.name);
          if (!variable) {
            continue;
          }
          const imported = variable.defs.find(definition => definition.type === 'ImportBinding')?.node;
          return imported?.type === 'ImportSpecifier' ? (imported.imported.name ?? imported.imported.value) : node.name;
        }
        return node.name;
      }

      if (node.type === 'TSQualifiedName') {
        return node.right.name;
      }

      if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier') {
        return node.property.name;
      }

      if (node.type === 'CallExpression' && ['optional', 'proxy'].includes(getName(node.callee))) {
        return getName(node.arguments[0]);
      }

      return null;
    }

    function checkName(identifier, serviceName) {
      if (!serviceName || !/^[A-Z].*(?:Service|Resource)$/.test(serviceName) || identifier.type !== 'Identifier') {
        return;
      }
      if (['EESDKService', 'AWSSDKService'].includes(serviceName) && identifier.name === 'sdk') {
        return;
      }

      const expectedName = serviceName.replace(/^[A-Z]+(?=[A-Z][a-z]|$)|^[A-Z]/, prefix => prefix.toLowerCase());
      if (identifier.name !== expectedName) {
        context.report({
          node: identifier,
          messageId: 'incorrectName',
          data: { serviceName, expectedName, actualName: identifier.name },
        });
      }
    }

    return {
      VariableDeclarator(node) {
        let initializer = node.init;
        while (initializer && ['TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression'].includes(initializer.type)) {
          initializer = initializer.expression;
        }

        if (initializer?.type === 'CallExpression' && getName(initializer.callee) === 'useService') {
          checkName(node.id, getName(initializer.arguments[0]));
        }
      },
      MethodDefinition(node) {
        if (node.kind !== 'constructor') {
          return;
        }

        for (const parameter of node.value.params) {
          let identifier = parameter.type === 'TSParameterProperty' ? parameter.parameter : parameter;
          if (identifier.type === 'AssignmentPattern') {
            identifier = identifier.left;
          }

          const type = identifier.typeAnnotation?.typeAnnotation;
          const serviceName = type?.type === 'TSTypeReference' ? getName(type.typeName) : null;
          checkName(identifier, serviceName);
        }
      },
    };
  },
};
