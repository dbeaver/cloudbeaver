/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Button, type PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';

import { TeamFormActionsContext } from './TeamFormActionsContext.js';
import type { TeamFormProps } from './TeamsAdministrationFormService.js';

export const TeamFormBaseActions: PlaceholderComponent<TeamFormProps> = observer(function TeamFormBaseActions({ formState }) {
  const translate = useTranslate();
  const actions = useContext(TeamFormActionsContext);

  if (!actions) {
    throw new Error('TeamFormActionsContext not provided');
  }

  return (
    <>
      {actions.onCancel && (
        <Button type="button" disabled={formState.isDisabled} mod={['outlined']} onClick={actions.onCancel}>
          {translate('ui_processing_cancel')}
        </Button>
      )}
      <Button type="button" disabled={formState.isDisabled} mod={['unelevated']} loader onClick={actions.save}>
        {translate(formState.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
      </Button>
    </>
  );
});
