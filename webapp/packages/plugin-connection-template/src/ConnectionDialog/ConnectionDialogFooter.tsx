/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, useS, useTranslate } from '@cloudbeaver/core-blocks';

import style from './ConnectionDialogFooter.module.css';

interface Props {
  isConnecting: boolean;
  onConnect: () => void;
  onBack: () => void;
}

export const ConnectionDialogFooter = observer<Props>(function ConnectionDialogFooter({ isConnecting, onConnect, onBack }) {
  const styles = useS(style);
  const translate = useTranslate();
  return (
    <div className={styles['controls']}>
      <div className={styles['fill']} />
      <Button type="button" mod={['outlined']} disabled={isConnecting} onClick={onBack}>
        {translate('ui_stepper_back')}
      </Button>
      <Button type="button" mod={['unelevated']} disabled={isConnecting} onClick={onConnect}>
        {isConnecting ? translate('ui_processing_connecting') : translate('connections_connection_connect')}
      </Button>
    </div>
  );
});
