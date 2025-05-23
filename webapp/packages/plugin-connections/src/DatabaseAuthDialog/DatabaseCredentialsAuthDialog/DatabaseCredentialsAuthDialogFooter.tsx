/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './DatabaseCredentialsAuthDialogFooter.module.css';

export interface Props {
  isAuthenticating: boolean;
  onLogin: () => void;
  className?: string;
}

export const DatabaseCredentialsAuthDialogFooter = observer<React.PropsWithChildren<Props>>(function DatabaseCredentialsAuthDialogFooter({
  isAuthenticating,
  onLogin,
  className,
  children,
}) {
  const style = useS(styles);
  const translate = useTranslate();

  return (
    <div className={s(style, { footerContainer: true }, className)}>
      {children}
      <Button className={s(style, { button: true })} type="button" disabled={isAuthenticating} loading={isAuthenticating} onClick={onLogin}>
        {translate('authentication_login')}
      </Button>
    </div>
  );
});
