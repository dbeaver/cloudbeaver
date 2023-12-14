/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, PlaceholderComponent, useTranslate } from '@cloudbeaver/core-blocks';

import type { ITeamFormProps } from './ITeamFormProps';

export const TeamFormBaseActions: PlaceholderComponent<ITeamFormProps> = observer(function TeamFormBaseActions({ state, onCancel }) {
  const translate = useTranslate();

  return (
    <>
      {onCancel && (
        <Button type="button" disabled={state.disabled} mod={['outlined']} onClick={onCancel}>
          {translate('ui_processing_cancel')}
        </Button>
      )}
      <Button type="button" disabled={state.disabled || state.readonly} mod={['unelevated']} loader onClick={state.save}>
        {translate(state.mode === 'edit' ? 'ui_processing_save' : 'ui_processing_create')}
      </Button>
    </>
  );
});
