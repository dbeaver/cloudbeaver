/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { Button, PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useAuthenticationAction } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from './IConnectionFormProps';

export const ConnectionFormBaseActions: PlaceholderComponent<IConnectionFormProps> = observer(function ConnectionFormBaseActions({
  state,
  onCancel,
}) {
  const translate = useTranslate();
  const authentication = useAuthenticationAction({
    origin: state.info?.origin ?? { type: AUTH_PROVIDER_LOCAL_ID, displayName: 'Local' },
  });

  return (
    <>
      {onCancel && (
        <Button
          type="button"
          disabled={state.disabled}
          mod={['outlined']}
          onClick={onCancel}
        >
          {translate('ui_processing_cancel')}
        </Button>
      )}
      <Button
        type="button"
        disabled={state.disabled || !authentication.authorized}
        mod={['outlined']}
        loader
        onClick={state.test}
      >
        {translate('connections_connection_test')}
      </Button>
      <Button
        type="button"
        disabled={state.disabled || state.readonly}
        mod={['unelevated']}
        loader
        onClick={state.save}
      >
        {translate(state.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
      </Button>
    </>
  );
});
