/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import styles from './CommonDialogFooter.module.css';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export const CommonDialogFooter = observer<Props>(function CommonDialogFooter({ children, className }) {
  const computedStyles = useS(styles);

  return <footer className={s(computedStyles, { footer: true }, className)}>{children}</footer>;
});
