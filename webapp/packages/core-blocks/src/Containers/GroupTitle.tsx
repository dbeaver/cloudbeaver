/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import { filterLayoutFakeProps } from './filterLayoutFakeProps';
import styles from './GroupTitle.m.css';
import type { ILayoutSizeProps } from './ILayoutSizeProps';
import elementsSizeStyles from './shared/ElementsSize.m.css';

export const GroupTitle: React.FC<ILayoutSizeProps & React.HTMLAttributes<HTMLHeadingElement>> = function GroupTitle({ className, ...rest }) {
  const style = useS(styles, elementsSizeStyles);
  const divProps = filterLayoutFakeProps(rest);
  return <h2 {...divProps} className={s(style, { groupTitle: true, ...(rest as ILayoutSizeProps) }, className)} />;
};
