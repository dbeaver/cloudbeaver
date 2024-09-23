/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import style from './SnackbarBody.module.css';

interface Props {
  title: string;
  className?: string;
}

export const SnackbarBody: React.FC<React.PropsWithChildren<Props>> = function SnackbarBody({ title, className, children }) {
  const styles = useS(style);
  return (
    <div className={s(styles, { notificationBody: true }, className)}>
      <div className={styles['bodyTextBlock']}>
        <h2 title={title} className={styles['textBlockTitle']}>
          {title}
        </h2>
        <div className={styles['message']}>{children}</div>
      </div>
    </div>
  );
};
