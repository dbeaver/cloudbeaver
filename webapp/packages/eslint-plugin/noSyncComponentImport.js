/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import path from 'path';
import fs from 'fs';

export default {
  meta: {
    docs: {
      description: 'Forbid importing .tsx files from .ts files directly, use React.lazy().',
    },
  },
  create: function create(context) {
    function checkFileExtension(node) {
      try {
        const importerExtension = path.extname(context.filename).substring(1);

        if (node.importKind === 'type' || node.exportKind === 'type' || importerExtension !== 'ts' || context.filename.endsWith('.d.ts')) {
          return;
        }

        const source = node.source;

        // bail if the declaration doesn't have a source, e.g. "export { foo };", or if it's only partially typed like in an editor
        if (!source || !source.value) {
          return;
        }

        const importPathWithQueryString = source.value;
        const importPath = importPathWithQueryString.replace(/\?(.*)$/, '');

        let resolvedPath = importPath;

        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          const filePath = path.resolve(path.dirname(context.filename), importPath);
          const extension = path.extname(filePath);

          if (extension === '.js' || extension === '.jsx' || extension === '') {
            const stem = extension ? filePath.slice(0, -extension.length) : filePath;
            // Match TypeScript extension substitution: a .ts sibling takes precedence over .tsx for .js imports.
            const candidates = extension === '.jsx' ? [`${stem}.tsx`] : [`${stem}.ts`, `${stem}.tsx`];
            resolvedPath = candidates.find(candidate => fs.existsSync(candidate));
          } else {
            resolvedPath = fs.existsSync(filePath) ? filePath : undefined;
          }
        }

        if (!resolvedPath) {
          return;
        }

        // get extension from resolved path, if possible.
        // for unresolved, use source value.
        const importExtension = path.extname(resolvedPath).substring(1);

        if (importExtension === 'tsx') {
          context.report({
            node: source,
            message: "Don't import/export .tsx files from .ts files directly, use React.lazy().",
          });
        }
      } catch (e) {
        console.error('@cloudbeaver/no-sync-component-import: ', e);
      }
    }

    return {
      ImportDeclaration: checkFileExtension,
      ExportNamedDeclaration: checkFileExtension,
      ExportAllDeclaration: checkFileExtension,
    };
  },
};
