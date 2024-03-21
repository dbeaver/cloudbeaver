/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './AuthDialogFooter.m.css';

export interface Props extends React.PropsWithChildren {
  authAvailable: boolean;
  isAuthenticating: boolean;
  onLogin: () => void;
}

export const AuthDialogFooter = observer<Props>(function AuthDialogFooter({ authAvailable, isAuthenticating, onLogin, children }) {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <div className={s(style, { footerContainer: true })}>
      {children}
      <Button
        className={s(style, { button: true })}
        type="button"
        mod={['unelevated']}
        loading={isAuthenticating}
        hidden={!authAvailable}
        onClick={onLogin}
      >
        {translate('authentication_login')}
      </Button>
    </div>
  );
});
