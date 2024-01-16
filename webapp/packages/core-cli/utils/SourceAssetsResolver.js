/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

class SourceAssetsResolver {
  // https://github.com/webpack/enhanced-resolve/
  constructor(extensions) {
    this.source = 'after-normal-resolve';
    this.target = 'relative';
    this.extensions = extensions;
  }

  apply(resolver) {
    const target = resolver.ensureHook(this.target);
    resolver.getHook(this.source).tapAsync('SourceAssetsResolver', (request, resolveContext, callback) => {
      const descriptionFileRoot = /** @type {string} */ (request.descriptionFileRoot);
      let relativePath = /** @type {string} */ (request.relativePath);
      const requestRequest = /** @type {string | undefined} */ (request.request);

      if (relativePath?.startsWith('./dist') && this.extensions.some(ext => requestRequest?.endsWith(ext))) {
        relativePath = './' + resolver.join(relativePath.replace('./dist', './src'), requestRequest);
        const path = resolver.join(descriptionFileRoot, relativePath);
        const obj = {
          ...request,
          path,
          relativePath,
          fullySpecified: false,
          request: undefined,
        };
        resolver.doResolve(target, obj, null, resolveContext, callback);
      } else {
        callback();
      }
    });
  }
}

module.exports = {
  SourceAssetsResolver,
};

// class CSSSourceResolver {
//   // https://github.com/webpack/enhanced-resolve/
//   constructor(supportedStyles) {
//     this.source = 'describedRelative';
//     this.target = 'file';
//     this.supportedStyles = supportedStyles;
//   }

//   apply(resolver) {
//     const target = resolver.ensureHook(this.target);
//     resolver.getHook(this.source).tapAsync('CSSSourceResolver', (request, resolveContext, callback) => {
//       const requestRelativePath = request.request ?? request.relativePath;
//       if (requestRelativePath.startsWith('./') && this.supportedStyles.test(requestRelativePath)) {
//         const srcRelativePath = join(request.descriptionFileRoot, 'src', relative('./dist', requestRelativePath));
//         var obj = {
//           path: srcRelativePath,
//           request: request.request,
//           query: request.query,
//           directory: request.directory,
//           context: request.context,
//         };
//         resolver.doResolve(target, obj, 'resolve css source: ' + srcRelativePath, resolveContext, callback);
//       } else {
//         callback();
//       }
//     });
//   }
// }
