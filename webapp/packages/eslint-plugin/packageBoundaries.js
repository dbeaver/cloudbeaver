/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import path from 'node:path';

function getPackageName(filename) {
  return Array.from(filename.matchAll(/(?:^|\/)packages\/([^/]+)/g)).at(-1)?.[1];
}

function getSourceValue(node) {
  if (node?.type === 'Literal' && typeof node.value === 'string') {
    return node.value;
  }

  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }

  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce imports from core and public plugins to respect package boundaries.',
    },
    schema: [],
    messages: {
      coreToPlugin: 'Core package "{{importer}}" must not import plugin "{{target}}".',
      publicToAdministration: 'Public plugin "{{importer}}" must not import administration plugin "{{target}}".',
    },
  },
  create: function create(context) {
    const filename = context.filename.replaceAll('\\', '/');
    const importer = getPackageName(filename);
    const isCore = importer?.startsWith('core-');
    const isPublicPlugin = importer?.startsWith('plugin-') && !importer.startsWith('plugin-set-') && !importer.endsWith('-administration');

    if (!isCore && !isPublicPlugin) {
      return {};
    }

    function checkSource(source) {
      const value = getSourceValue(source);

      if (!value) {
        return;
      }

      const importPath = value.replace(/[?#].*$/, '').replaceAll('\\', '/');
      let target;

      if (importPath.startsWith('@cloudbeaver/')) {
        target = importPath.split('/')[1];
      } else if (importPath.startsWith('.') || path.posix.isAbsolute(importPath)) {
        target = getPackageName(path.posix.resolve(path.posix.dirname(filename), importPath));
      }

      if (!target?.startsWith('plugin-')) {
        return;
      }

      let messageId;

      if (isCore) {
        messageId = 'coreToPlugin';
      } else if (target.endsWith('-administration')) {
        messageId = 'publicToAdministration';
      }

      if (messageId) {
        context.report({ node: source, messageId, data: { importer, target } });
      }
    }

    function checkDeclaration(node) {
      checkSource(node.source);
    }

    return {
      ImportDeclaration: checkDeclaration,
      ExportNamedDeclaration: checkDeclaration,
      ExportAllDeclaration: checkDeclaration,
      ImportExpression: checkDeclaration,
      TSImportType: checkDeclaration,
      TSExternalModuleReference(node) {
        checkSource(node.expression);
      },
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'require' || node.arguments.length !== 1) {
          return;
        }

        let scope = context.sourceCode.getScope(node);

        while (scope) {
          if (scope.set.get('require')?.defs.length) {
            return;
          }

          scope = scope.upper;
        }

        checkSource(node.arguments[0]);
      },
    };
  },
};
