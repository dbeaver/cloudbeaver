/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Button, type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';

import { ConnectionPreferencesFormActionsContext } from './ConnectionPreferencesFormActionsContext.js';
import type { IConnectionPreferencesFormProps } from './IConnectionPreferencesFormState.js';

export const ConnectionPreferencesFormBaseActions: PlaceholderComponent<IConnectionPreferencesFormProps> = observer(function ConnectionPreferencesFormBaseActions({ formState }) {
  const actions = useContext(ConnectionPreferencesFormActionsContext);

  if (!actions) {
    throw new Error('ConnectionPreferencesFormActionsContext not provided');
  }

  const translate = useTranslate();

  return (
    <>
      {actions.onCancel && (
        <Button type="button" disabled={formState.isDisabled} variant="secondary" onClick={actions.onCancel}>
          {translate('ui_processing_cancel')}
        </Button>
      )}
      <Button type="button" disabled={formState.isDisabled || formState.isReadOnly || !formState.isChanged} loader onClick={actions['save']}>
        {translate(formState.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
      </Button>
    </>
  );
});
