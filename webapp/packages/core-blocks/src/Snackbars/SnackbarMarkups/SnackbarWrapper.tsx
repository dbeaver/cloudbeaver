import styled, { css, use } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

import { IconButton } from '../../IconButton';

const SNACKBAR_WRAPPER_STYLES = composes(
  css`
  notification {
    composes: theme-background-surface theme-text-on-surface from global;
  }`,
  css` 
  notification {
    composes: theme-elevation-z5 from global;
    position: relative;
    display: flex;
    box-sizing: border-box;
    overflow: hidden;
    width: 500px;
    margin-bottom: 16px;
    margin-left: 16px;
    padding: 16px 16px;
    line-height: 1.5;
    opacity: 0;
    border-radius: 4px;
    transition: opacity 0.3s ease-in-out, transform 0.5s ease-in-out;
    transform: translateX(-100%);

    &[use|mounted] {
      transform: translateX(0);
      opacity: 1;
    }
    &[use|closing] {
      opacity: 0;
    }
  }
  IconButton {
    position: absolute;
    top: 8px;
    right: 8px;
    height: 22px;
    width: 22px;
    &:hover {
      opacity: 0.7;
    }
  }`
);

interface ISnackbarWrapperProps {
  mounted: boolean;
  closing: boolean;
  closeable: boolean;
  onClose?: () => void;
}

export const SnackbarWrapper: React.FC<ISnackbarWrapperProps>
  = function SnackbarWrapper({ mounted, closing, closeable, onClose, children, ...rest }) {
    const styles = useStyles(SNACKBAR_WRAPPER_STYLES);

    return styled(styles)(
      <notification as="div" {...use({ mounted, closing })} {...rest}>
        {children}
        {closeable && onClose && (
          <IconButton name="cross" viewBox="0 0 16 16" onClick={onClose} />
        )}
      </notification>
    );
  };
