/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { printMessage } from '../utils/printMessage.js';

export class PackageLogger {
  private isPackageJsonPathPrinted: boolean;

  constructor(private currentPackagePath: string) {
    this.isPackageJsonPathPrinted = false;
  }

  log(type: 'success' | 'info' | 'warn' | 'error', replace: boolean, message: string, ...args: any[]) {
    if (type !== 'success' && type !== 'info' && !this.isPackageJsonPathPrinted) {
      this.isPackageJsonPathPrinted = true;
      this.log('info', false, 'Package: ' + this.currentPackagePath);
    }

    let color = '\x1b[34m%s\x1b[0m';
    if (type === 'warn') {
      color = '\x1b[33m%s\x1b[0m';
    } else if (type === 'error') {
      color = '\x1b[31m%s\x1b[0m';
    } else if (type === 'success') {
      color = '\x1b[32m%s\x1b[0m';
    }

    printMessage(color, replace, message, ...args);
  }
}
