/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { buildTemplatePath } from './buildTemplatePath';
import type { PathTemplate } from './createPathTemplate';
import { testPath } from './testPath';

const SPECIAL_SYMBOLS = /([.?*+^$[\]\\(){}|-])/g;

export function pathAfter<T extends Record<string, any>>(
  path: string,
  after: string | PathTemplate<T>
): string {
  if (typeof after === 'string') {
    const substrRegExp = new RegExp('^' + quote(after) + '/?', 'g');
    return path.replace(substrRegExp, '');
  } else {
    const match = testPath(after, path, true);
    if (match) {
      return pathAfter(path, buildTemplatePath(after, match));
    }
  }
  return path;
}

function quote(str: string): string {
  return str.replace(SPECIAL_SYMBOLS, '\\$1');
}