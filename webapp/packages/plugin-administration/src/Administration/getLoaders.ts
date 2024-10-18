/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAdministrationItem } from '@cloudbeaver/core-administration';
import type { ILoadableState } from '@cloudbeaver/core-utils';

export function reduceLoaders(acc: ILoadableState[], item: IAdministrationItem): ILoadableState[] {
  if (!item.getLoader) {
    return acc;
  }

  const loader = item.getLoader();

  if (Array.isArray(loader)) {
    acc.push(...loader);
  } else {
    acc.push(loader);
  }

  return acc;
}
