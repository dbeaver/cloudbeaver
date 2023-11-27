/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../../s';
import { useS } from '../../useS';
import style from './SnackbarFooter.m.css';

interface Props {
  timestamp: number;
  className?: string;
}

export const SnackbarFooter: React.FC<React.PropsWithChildren<Props>> = function SnackbarFooter({ timestamp, className, children }) {
  const styles = useS(style);
  const timeStringFromTimestamp = new Date(timestamp).toLocaleTimeString();

  return (
    <div className={s(styles, { notificationFooter: true }, className)}>
      <span className={styles.footerTime}>{timeStringFromTimestamp}</span>
      <div className={styles.actions}>{children}</div>
    </div>
  );
};
