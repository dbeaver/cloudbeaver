/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PATH_TEMPLATE_LINK_SYMBOL } from './PATH_TEMPLATE_LINK_SYMBOL';

export function createPathPart<T extends string, TLink extends string>(id: T, link?: TLink): `${TLink}${typeof PATH_TEMPLATE_LINK_SYMBOL}${T}` {
  return `${link ? `${link}${PATH_TEMPLATE_LINK_SYMBOL}` : ''}${id}` as `${TLink}${typeof PATH_TEMPLATE_LINK_SYMBOL}${T}`;
}