/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PathParams, PathTemplate } from './createPathTemplate';

export function buildTemplatePath<
  TTemplate extends string,
  TParams extends PathParams<TTemplate>
>(
  template: PathTemplate<TParams>,
  params: TParams,
): string {
  params = { ...params };

  for (const param of template.params) {
    const token = template.tokens.find(token => token.type === 'url-parameter' && token.val.includes(param));
    if (!token) {
      continue;
    }
    const type = RegExp(`:${param}<(\\^\\(|)(.+?)\\[`).exec(token.match);

    if (!type) {
      continue;
    }
    if (param in params) {
      (params as any)[param] = `${type[2]}${(params as any)[param]}`;
    }
  }

  return template.build(params);
}