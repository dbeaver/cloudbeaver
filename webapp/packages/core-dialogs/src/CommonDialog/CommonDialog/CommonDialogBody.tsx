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

import styles from './CommonDialogBody.m.css';

interface Props {
  noBodyPadding?: boolean;
  noOverflow?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: ComponentStyle;
}

export const CommonDialogBody = observer<Props>(function CommonDialogBody({ noBodyPadding, noOverflow, className, children, style }) {
  const computedStyles = useS(styles, style);

  return (
    <div className={s(computedStyles, { body: true, noBodyPadding, noOverflow }, className)}>
      <div className={s(computedStyles, { dialogBodyOverflowBox: true })}>
        <div className={s(computedStyles, { dialogBodyContent: true })}>{children}</div>
        {!noOverflow && <div className={s(computedStyles, { dialogBodyOverflow: true })} />}
      </div>
    </div>
  );
});
