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
  provider?: string | null;
  disabled: boolean;
  onConnect: () => Promise<void>;
}

export const ConnectSubscription = observer<Props>(function ConnectSubscription({ provider, disabled, onConnect }) {
  const translate = useTranslate();
  return (
    <Container className="tw:self-start" keepSize>
      <Button type="button" disabled={disabled} onClick={onConnect}>
        {provider ? translate('plugin_ai_account_connect_provider', undefined, { provider }) : translate('plugin_ai_account_connect')}
      </Button>
    </Container>
  );
});
