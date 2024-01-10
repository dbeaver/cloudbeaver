/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import { filterLayoutFakeProps, getLayoutProps } from './filterLayoutFakeProps';
import styles from './GroupItem.m.css';
import type { ILayoutSizeProps } from './ILayoutSizeProps';

export const GroupItem: React.FC<ILayoutSizeProps & React.HTMLAttributes<HTMLDivElement>> = function GroupItem({ className, ...rest }) {
  const style = useS(styles);
  const divProps = filterLayoutFakeProps(rest);
  const layoutProps = getLayoutProps(rest);
  return <div {...divProps} className={s(style, { groupItem: true, ...layoutProps }, className)} />;
};
