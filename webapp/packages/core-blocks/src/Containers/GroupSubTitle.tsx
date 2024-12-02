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
import styles from './GroupSubTitle.module.css';
import type { ILayoutSizeProps } from './ILayoutSizeProps.js';

export const GroupSubTitle: React.FC<ILayoutSizeProps & React.HTMLAttributes<HTMLHeadingElement>> = function GroupSubTitle({ className, ...rest }) {
  const style = useS(styles);
  const divProps = filterLayoutFakeProps(rest);
  const layoutProps = getLayoutProps(rest);
  return <span {...divProps} className={s(style, { groupSubTitle: true, ...layoutProps }, className)} />;
};
