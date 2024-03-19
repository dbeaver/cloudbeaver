/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, ObjectPropertyInfoForm } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { isSafari } from '@cloudbeaver/core-utils';

interface Props {
  credentials?: Record<string, any>;
  defaultCredentials?: Record<string, any>;
  properties: ReadonlyArray<ObjectPropertyInfo>;
  readonly?: boolean;
  disabled?: boolean;
}

export const ConnectionAuthModelCredentialsForm = observer<Props>(function ConnectionAuthModelCredentialsForm({
  credentials,
  defaultCredentials,
  properties,
  readonly,
  disabled,
}) {
  return (
    <Container wrap gap hideEmpty>
      <ObjectPropertyInfoForm
        autofillToken={isSafari ? 'section-connection-authentication section-secrets' : 'new-password'}
        properties={properties}
        state={credentials}
        defaultState={defaultCredentials}
        disabled={disabled}
        readOnly={readonly}
        showRememberTip
        hideEmptyPlaceholder
        tiny
      />
    </Container>
  );
});
