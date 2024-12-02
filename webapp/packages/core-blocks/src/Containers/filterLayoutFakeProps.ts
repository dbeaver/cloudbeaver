/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ILayoutSizeProps } from './ILayoutSizeProps.js';

export function filterLayoutFakeProps<T extends ILayoutSizeProps>(props: T): Omit<T, keyof ILayoutSizeProps> {
  const { noWrap, keepSize, tiny, small, medium, large, maximum, fill, noGrow, zeroBasis, groupGap, ...rest } = props;

  return rest;
}

export function getLayoutProps<T extends ILayoutSizeProps>(props: T): ILayoutSizeProps {
  const { noWrap, keepSize, tiny, small, medium, large, maximum, fill, noGrow, zeroBasis, groupGap } = props;
  return { noWrap, keepSize, tiny, small, medium, large, maximum, fill, noGrow, zeroBasis, groupGap };
}
