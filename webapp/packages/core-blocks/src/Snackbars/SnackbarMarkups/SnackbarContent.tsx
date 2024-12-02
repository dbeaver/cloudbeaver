/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import style from './SnackbarContent.module.css';

interface Props {
  className?: string;
}

export const SnackbarContent: React.FC<React.PropsWithChildren<Props>> = function SnackbarContent({ children, className }) {
  const styles = useS(style);
  return <div className={s(styles, { notificationContent: true }, className)}>{children}</div>;
};
