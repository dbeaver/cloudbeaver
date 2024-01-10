/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

module.exports = {
  meta: {
    docs: {
      description: 'Reshadow package is deprecated',
    },
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        const moduleName = node.source.value;
        if (moduleName === 'reshadow') {
          context.report({
            node,
            message: 'This package is deprecated. Use CSS modules instead.',
          });
        }
      },
    };
  },
};
