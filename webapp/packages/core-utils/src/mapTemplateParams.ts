/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPath } from './createPath';
import type { PathParams, PathTemplate } from './createPathTemplate';
import { getPathParts } from './getPathParts';

export function mapTemplateParams<
  TTemplate extends string,
  TParams extends PathParams<TTemplate>
>(
  template: PathTemplate<TParams>,
  params: TParams,
): TParams {
  params = { ...params };

  for (const param of template.params) {
    const token = template.tokens.find(token => token.type === 'url-parameter' && token.val.includes(param));
    if (!token) {
      continue;
    }
    const type = RegExp(`:${param}<(\\(|)(.+?)\\[`).exec(token.match);

    if (!type) {
      continue;
    }

    if (param in params) {
      const link = type[2].replace('\\', '');
      (params as any)[param] = createPath(...getPathParts((params as any)[param] as string)
        .map(paramValue => {
          if (paramValue.startsWith(link)) {
            return paramValue.slice(link.length);
          }
          return `${link}${paramValue}`;
        }));

    }
  }

  return params;
}