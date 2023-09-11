/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import styles from './CommonDialogFooter.m.css';

interface Props {
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogFooter = observer<Props>(function CommonDialogFooter({ children, className, style }) {
  const computedStyles = useS(styles, style);

  return <footer className={s(computedStyles, { footer: true }, className)}>{children}</footer>;
});
