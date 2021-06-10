/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
  footer-container {
    display: flex;
    width: min-content;
    flex: 1;
    align-items: center;
    justify-content: flex-end;
  }
  footer-container > :not(:first-child) {
    margin-left: 16px;
  }
  Button {
    flex: 0 0 auto;
  }
`;

export interface Props {
  onChange: () => void;
  onCancel: () => void;
  formFilled: boolean;
  submitting: boolean;
  className?: string;
}

export const ChangeUserPasswordDialogFooter: React.FC<Props> = observer(function ChangeUserPasswordDialogFooter({
  onChange,
  onCancel,
  formFilled,
  submitting,
  className,
  children,
}) {
  const translate = useTranslate();

  return styled(styles)(
    <footer-container className={className}>
      {children}
      <Button disabled={submitting} type="button" mod={['outlined']} onClick={onCancel}>
        {translate('ui_processing_cancel')}
      </Button>
      <Button disabled={submitting || !formFilled} loading={submitting} type="button" mod={['unelevated']} onClick={onChange}>
        {translate('authentication_user_password_change_dialog_submit')}
      </Button>
    </footer-container>
  );
});
