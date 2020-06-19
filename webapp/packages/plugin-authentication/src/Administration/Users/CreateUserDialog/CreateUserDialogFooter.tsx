/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

const styles = css`
  controls {
    display: flex;
    height: 100%;
    flex: 1;
    align-items: center;
    margin: auto;
    justify-content: flex-end;
  }

  fill {
    flex: 1;
  }
`;

export type Props = {
  isCreating: boolean;
  onCancel(): void;
  onCreate(): void;
}

export const CreateUserDialogFooter = observer(
  function CreateUserDialogFooter({
    isCreating,
    onCancel,
    onCreate,
  }: Props) {
    const translate = useTranslate();

    return styled(styles)(
      <controls as="div">
        <Button
          type="button"
          mod={['outlined']}
          onClick={onCancel}
          disabled={isCreating}
        >
          {translate('ui_processing_cancel')}
        </Button>
        <fill as="div"/>
        <Button
          type="button"
          mod={['unelevated']}
          onClick={onCreate}
          disabled={isCreating}
        >
          {translate('authentication_create_user_dialog_create')}
        </Button>
      </controls>
    );
  }
);
