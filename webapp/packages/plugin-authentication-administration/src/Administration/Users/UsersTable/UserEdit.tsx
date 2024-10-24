/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  ConfirmationDialog,
  GroupTitle,
  Loader,
  s,
  type TableItemExpandProps,
  useExecutor,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { FormMode } from '@cloudbeaver/core-ui';

import { AdministrationUserForm } from '../UserForm/AdministrationUserForm.js';
import { useAdministrationUserFormState } from './useAdministrationUserFormState.js';
import style from './UserEdit.module.css';
import { UsersTableOptionsPanelService } from './UsersTableOptionsPanelService.js';

export const UserEdit = observer<TableItemExpandProps<string>>(function UserEdit({ item, onClose }) {
  const translate = useTranslate();
  const styles = useS(style);
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);
  const commonDialogService = useService(CommonDialogService);
  const state = useAdministrationUserFormState(item, state => state.setMode(FormMode.Edit));

  useExecutor({
    executor: usersTableOptionsPanelService.onClose,
    handlers: [
      async function closeHandler(_, contexts) {
        if (state.isChanged) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'core_blocks_confirmation_dialog_title',
            message: 'administration_drivers_driver_unsaved_changes',
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
    <ColoredContainer className={s(styles, { box: true })} vertical parent noWrap surface gap compact>
      <GroupTitle header onClose={usersTableOptionsPanelService.close}>
        {`${translate('ui_edit')}${state.state.userId ? ` "${state.state.userId}"` : ''}`}
      </GroupTitle>
      <Loader suspense>
        <AdministrationUserForm state={state} onClose={onClose} />
      </Loader>
    </ColoredContainer>
  );
});
