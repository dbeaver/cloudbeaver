/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s.js';
import { useS } from '../useS.js';
import { filterLayoutFakeProps, getLayoutProps } from './filterLayoutFakeProps.js';
import styles from './GroupTitle.module.css';
import type { ILayoutSizeProps } from './ILayoutSizeProps.js';
import elementsSizeStyles from './shared/ElementsSize.module.css';

interface Props {
  sticky?: boolean;
  header?: boolean;
}

export const GroupTitle: React.FC<Props & ILayoutSizeProps & React.HTMLAttributes<HTMLHeadingElement>> = function GroupTitle({
  sticky,
  header,
  className,
  ...rest
}) {
  const style = useS(styles, elementsSizeStyles);
  const divProps = filterLayoutFakeProps(rest);
  const layoutProps = getLayoutProps(rest);

  return <h2 tabIndex={-1} {...divProps} className={s(style, { groupTitle: true, sticky, header, ...layoutProps }, className)} />;
};
