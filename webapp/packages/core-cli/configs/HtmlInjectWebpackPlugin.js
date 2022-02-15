/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const HtmlWebpackPlugin = require('html-webpack-plugin');

class HtmlInjectWebpackPlugin {
  constructor(options) {
    this.options = options;
  }
  apply (compiler) {
    compiler.hooks.compilation.tap('HtmlInjectWebpackPlugin', (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
        'HtmlInjectWebpackPlugin',
        (data, cb) => {
          if(this.options.head) {
            data.headTags.push(...this.options.head)
          }
          if(this.options.body) {
            data.bodyTags.push(...this.options.body)
          }
          cb(null, data)
        }
      )
    })
  }
}

module.exports = HtmlInjectWebpackPlugin