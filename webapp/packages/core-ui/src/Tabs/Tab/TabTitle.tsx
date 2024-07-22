/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s, useS } from '@cloudbeaver/core-blocks';

import TabTitleStyles from './TabTitle.module.css';

export interface TabTitleProps {
  className?: string;
}

export const TabTitle: React.FC<React.PropsWithChildren<TabTitleProps>> = function TabTitle({ children, className }) {
  const styles = useS(TabTitleStyles);
  return <div className={s(styles, { tabTitle: true }, className)}>{children || <div className={s(styles, { placeholder: true })} />}</div>;
};
