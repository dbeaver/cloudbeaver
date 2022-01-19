/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';

import { Loader } from '../../Loader/Loader';
import { NotificationMark } from '../NotificationMark';

const SNACKBAR_STATUS_STYLES = css`
  NotificationMark {
    padding-right: 12px; 
  }
  loader-container {
    padding-right: 12px;
    & Loader {
      width: 40px;
      height: 40px;
    }
  }
`;

interface SnackbarStatusProps {
  status: ENotificationType;
  className?: string;
}

export const SnackbarStatus: React.FC<SnackbarStatusProps> = function SnackbarStatus({ status, className }) {
  return styled(SNACKBAR_STATUS_STYLES)(
    status === ENotificationType.Loading ? (
      <loader-container className={className}>
        <Loader fullSize hideMessage />
      </loader-container>
    ) : <NotificationMark className={className} type={status} />);
};
