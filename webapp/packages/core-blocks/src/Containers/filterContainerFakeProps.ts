/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { filterLayoutFakeProps } from './filterLayoutFakeProps';
import type { IContainerProps } from './IContainerProps';

export function filterContainerFakeProps<T extends IContainerProps>(props: T): Omit<T, keyof IContainerProps> {
  const {
    flexStart,
    baseline,
    center,
    vertical,
    wrap,
    overflow,
    parent,
    gap,
    grid,
    dense,
    ...rest
  } = filterLayoutFakeProps(props);

  return rest as Omit<T, keyof IContainerProps>;
}
