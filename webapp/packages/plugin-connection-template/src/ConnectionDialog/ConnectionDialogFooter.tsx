/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
controls {
  display: flex;
  flex: 1;
  height: 100%;
  align-items: center;
  margin: auto;
}

fill {
  flex: 1;
}

Button:not(:first-child) {
  margin-left: 24px;
}
`;

interface Props {
  isConnecting: boolean;
  onConnect: () => void;
  onBack: () => void;
}

export const ConnectionDialogFooter = observer<Props>(function ConnectionDialogFooter({
  isConnecting,
  onConnect,
  onBack,
}) {
  const translate = useTranslate();
  return styled(styles)(
    <controls as="div">
      <Button
        type="button"
        mod={['outlined']}
        disabled={isConnecting}
        onClick={onBack}
      >
        {translate('ui_stepper_back')}
      </Button>
      <fill as="div" />
      <Button
        type="button"
        mod={['unelevated']}
        disabled={isConnecting}
        onClick={onConnect}
      >
        {isConnecting
          ? translate('basicConnection_connectionDialog_connecting')
          : translate('connections_connection_connect')}
      </Button>
    </controls>
  );
}
);
