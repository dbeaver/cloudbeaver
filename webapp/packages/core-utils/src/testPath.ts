/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PathParams, PathTemplate } from './createPathTemplate';
import { mapTemplateParams } from './mapTemplateParams';

export function testPath<
  TTemplate extends string,
  TParams extends PathParams<TTemplate>
>(
  template: PathTemplate<TParams>,
  path: string,
  partial?: boolean
): TParams | null {
  let params: TParams | null = null;

  if (partial) {
    params = template.partialTest(path);
  } else {
    params = template.test(path);
  }

  if (!params) {
    return null;
  }

  return mapTemplateParams(template, params);
}