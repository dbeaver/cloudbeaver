import styled, { css } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';

import { Loader } from '../../Loader/Loader';
import { NotificationMark } from '../NotificationMark';

interface SnackbarStatusProps {
  status: ENotificationType;
}

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

export const SnackbarStatus: React.FC<SnackbarStatusProps> = function SnackbarStatus({ status, ...rest }) {
  return styled(SNACKBAR_STATUS_STYLES)(
    status === ENotificationType.Loading ? (
      <loader-container {...rest} as='div'>
        <Loader fullSize hideMessage />
      </loader-container>
    ) : <NotificationMark {...rest} type={status} />);
};
