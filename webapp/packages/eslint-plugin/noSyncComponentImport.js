/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
  create: function (context) {
    function checkFileExtension(node) {
      try {
        const importerExtension = path.extname(context.filename).substring(1);

        if (node.importKind === 'type' || node.exportKind === 'type' || importerExtension !== 'ts') {
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
          resolvedPath = path.resolve(path.dirname(context.filename), importPath.replace('.js', ''));

          if (path.extname(resolvedPath) === '') {
            resolvedPath += '.tsx';
          }

          if (!fs.existsSync(resolvedPath)) {
            return;
          }
        } // else {
        //   resolvedPath = pnpapi.resolveRequest(importPath, context.filename);

        //   if (resolvedPath === null) {
        //     return;
        //   }

        //   const possibleSrcFile = resolvedPath.replace('/dist/', '/src/').replace('.js', '.tsx');
        //   console.log(resolvedPath, possibleSrcFile);
        //   if (!fs.existsSync(possibleSrcFile)) {
        //     return;
        //   }
        // }

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
