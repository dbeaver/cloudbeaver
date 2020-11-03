import styled, { css } from 'reshadow';

const SNACKBAR_CONTENT_STYLES = css`
  notification-content {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
`;
export const SnackbarContent: React.FC = function SnackbarContent({ children, ...rest }) {
  return styled(SNACKBAR_CONTENT_STYLES)(
    <notification-content as='div' {...rest}>
      {children}
    </notification-content>
  );
};
