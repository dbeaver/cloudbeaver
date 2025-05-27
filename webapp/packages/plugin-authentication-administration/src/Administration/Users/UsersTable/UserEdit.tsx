/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  ConfirmationDialog,
  GroupBack,
  GroupTitle,
  Loader,
  type TableItemExpandProps,
  Text,
  useExecutor,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm.js';
import { useAdministrationUserFormState } from './useAdministrationUserFormState.js';
import { UsersTableOptionsPanelService } from './UsersTableOptionsPanelService.js';

export const UserEdit = observer<TableItemExpandProps<string>>(function UserEdit({ item, onClose }) {
  const translate = useTranslate();
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);
  const commonDialogService = useService(CommonDialogService);
  const state = useAdministrationUserFormState(item, state => state.setMode(FormMode.Edit));

  useExecutor({
    executor: usersTableOptionsPanelService.onClose,
    handlers: [
      async function closeHandler(event, contexts) {
        if (state.isChanged && event === 'before') {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'core_blocks_confirmation_dialog_title',
            message: 'ui_save_reminder',
            confirmActionText: 'ui_close',
          });

          if (result === DialogueStateResult.Rejected) {
            ExecutorInterrupter.interrupt(contexts);
          }
        }
      },
    ],
  });

  return (
    <ColoredContainer aria-label={translate('plugin_authentication_administration_user_form_edit_label')} vertical parent noWrap surface gap compact>
      <GroupTitle header>
        <GroupBack onClick={usersTableOptionsPanelService.close}>
          <Text truncate>
            {translate('ui_edit')}
            {state.state.userId ? ` "${state.state.userId}"` : ''}
          </Text>
        </GroupBack>
      </GroupTitle>
      <Loader suspense>
        <AdministrationUserForm state={state} onClose={onClose} />
      </Loader>
    </ColoredContainer>
  );
});
