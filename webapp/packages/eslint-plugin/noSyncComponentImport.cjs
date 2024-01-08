/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const path = require('path');
const fs = require('fs');

module.exports = {
  meta: {
    docs: {
      description: 'Forbid importing .tsx files from .ts files directly, use React.lazy().',
    },
  },
  create: function (context) {
    function checkFileExtension(node) {
      if (node.importKind === 'type' || node.exportKind === 'type') {
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
        resolvedPath = path.resolve(path.dirname(context.filename), importPath);

        if (path.extname(resolvedPath) === '') {
          resolvedPath += '.tsx';
        }

        if (!fs.existsSync(resolvedPath)) {
          return;
        }
      } else {
        resolvedPath = require.resolve(importPath, { paths: [path.dirname(context.filename)] });
      }

      // get extension from resolved path, if possible.
      // for unresolved, use source value.
      const importExtension = path.extname(resolvedPath).substring(1);
      const importerExtension = path.extname(context.filename).substring(1);

      if (importerExtension === 'ts' && importExtension === 'tsx') {
        context.report({
          node: source,
          message: "Don't import/export .tsx files from .ts files directly, use React.lazy().",
        });
      }
    }

    return {
      ImportDeclaration: checkFileExtension,
      ExportNamedDeclaration: checkFileExtension,
      ExportAllDeclaration: checkFileExtension,
    };
  },
};
