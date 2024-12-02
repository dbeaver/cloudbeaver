/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { filterLayoutFakeProps, getLayoutProps } from './filterLayoutFakeProps.js';
import type { IContainerProps } from './IContainerProps.js';

export function filterContainerFakeProps<T extends IContainerProps>(props: T): Omit<T, keyof IContainerProps> {
  const { hideEmpty, flexStart, flexEnd, baseline, center, vertical, wrap, overflow, parent, gap, grid, dense, compact, ...rest } =
    filterLayoutFakeProps(props);

  return rest as Omit<T, keyof IContainerProps>;
}

export function getContainerProps<T extends IContainerProps>(props: T): IContainerProps {
  const { hideEmpty, flexStart, flexEnd, baseline, center, vertical, wrap, overflow, parent, gap, grid, dense, compact, ...rest } = props;
  return { hideEmpty, flexStart, flexEnd, baseline, center, vertical, wrap, overflow, parent, gap, grid, dense, compact, ...getLayoutProps(rest) };
}
