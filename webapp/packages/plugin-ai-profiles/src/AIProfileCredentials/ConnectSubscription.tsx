/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button, Container, useTranslate } from '@cloudbeaver/core-blocks';

interface Props {
  disabled: boolean;
  onConnect: () => Promise<void>;
}

export const ConnectSubscription = observer<Props>(function ConnectSubscription({ disabled, onConnect }) {
  const translate = useTranslate();
  return (
    <Container className="tw:self-start" keepSize>
      <Button type="button" disabled={disabled} onClick={onConnect}>
        {translate('plugin_ai_account_connect')}
      </Button>
    </Container>
  );
});
