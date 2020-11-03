import styled, { css } from 'reshadow';

const SNACKBAR_BODY_STYLES = css`
  notification-body {
    display: flex;
    flex-direction: column;
    flex: 1 0 0;
    & body-text-block {
      margin-top: 8px;
      padding-right: 24px;
      & message {
        font-size: 16px;
        opacity: 0.8;
        overflow: auto;
        max-height: 200px;
        margin-bottom: 8px;
        word-break: break-word;
      }
    }
  }

  text-block-title {
    composes: theme-typography--headline6 from global;
    max-width: 392px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    line-height: 1.55rem;
    font-weight: 700;
    margin: 0;
    padding: 0;
    margin-bottom: 8px;
  }
`;

interface ISnackbarBodyProps {
  title: string;
  message?: string;
  preMessage?: string;

}
export const SnackbarBody: React.FC<ISnackbarBodyProps> = function SnackbarBody(
  { title, message, preMessage, ...rest }) {
  return styled(SNACKBAR_BODY_STYLES)(
    <notification-body {...rest} as="div">
      <body-text-block as='div'>
        <text-block-title title={title} as='h2'>{title}</text-block-title>
        {message && <message as="div">{message}</message>}
      </body-text-block>
    </notification-body>
  );
};
