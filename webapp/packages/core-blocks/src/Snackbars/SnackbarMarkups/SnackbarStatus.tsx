/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ENotificationType } from '@cloudbeaver/core-events';

import { Loader } from '../../Loader/Loader.js';
import { s } from '../../s.js';
import { useS } from '../../useS.js';
import { NotificationMark } from '../NotificationMark.js';
import style from './SnackbarStatus.module.css';

interface SnackbarStatusProps {
  status: ENotificationType;
  className?: string;
}

export const SnackbarStatus: React.FC<SnackbarStatusProps> = function SnackbarStatus({ status, className }) {
  const styles = useS(style);
  return status === ENotificationType.Loading ? (
    <div className={s(styles, { loaderContainer: true }, className)}>
      <Loader className={styles['loader']} hideMessage />
    </div>
  ) : (
    <NotificationMark className={s(styles, { notificationMark: true }, className)} type={status} />
  );
};
