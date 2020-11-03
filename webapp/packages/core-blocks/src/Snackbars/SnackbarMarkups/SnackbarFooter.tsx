import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import { Button } from '../../Button';

interface ISnackbarFooter {
  timestamp: number;
  onShowDetails?: () => void;
  disabled?: boolean;
}

const SNACKBAR_FOOTER_STYLES = css`
  notification-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  footer-time {
    composes: theme-typography--caption from global;
    opacity: 0.7;
  }
`;

export const SnackbarFooter: React.FC<ISnackbarFooter> = observer(function SnackbarFooter(
  { timestamp, onShowDetails, disabled, ...rest }) {
  const timeStringFromTimestamp = new Date(timestamp).toLocaleTimeString();
  const translate = useTranslate();

  return styled(SNACKBAR_FOOTER_STYLES)(
    <notification-footer {...rest} as='div'>
      <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
      {onShowDetails && (
        <actions as="div">
          <Button
            type="button"
            mod={['outlined']}
            disabled={disabled}
            onClick={onShowDetails}
          >
            {translate('ui_errors_details')}
          </Button>
        </actions>
      )}
    </notification-footer>
  );
});
