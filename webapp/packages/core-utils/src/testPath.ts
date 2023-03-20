/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PathParams, PathTemplate } from './createPathTemplate';

export function testPath<
  TTemplate extends string,
  TParams extends PathParams<TTemplate>
>(
  template: PathTemplate<TParams>,
  path: string,
  partial?: boolean
): TParams | null {
  if (partial) {
    return template.partialTest(path);
  }

  return template.test(path);
}