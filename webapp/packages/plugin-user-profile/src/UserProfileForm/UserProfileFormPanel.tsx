/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ConfirmationDialog, useExecutor } from '@cloudbeaver/core-blocks';
import { App, useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { FormMode, TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { userProfileContext } from '../userProfileContext';
import { UserProfileOptionsPanelService } from '../UserProfileOptionsPanelService';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileFormService } from './UserProfileFormService';
import { UserProfileFormState } from './UserProfileFormState';

export const UserProfileFormPanel: TabContainerPanelComponent = observer(function UserProfileFormPanel({ tabId }) {
  const appService = useService(App);
  const userProfileFormService = useService(UserProfileFormService);
  const userProfileOptionsPanelService = useService(UserProfileOptionsPanelService);
  const commonDialogService = useService(CommonDialogService);

  const [state] = useState(() => {
    const state = new UserProfileFormState(appService, userProfileFormService, {});
    state.setMode(FormMode.Edit);

    return state;
  });

  useExecutor({
    executor: userProfileOptionsPanelService.onClose,
    handlers: [
      async function closeHandler(_, contexts) {
        const context = contexts.getContext(userProfileContext);

        if (state.isChanged() && !context.force) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'connections_public_connection_edit_cancel_title',
            message: 'connections_public_connection_edit_cancel_message',
            confirmActionText: 'ui_processing_ok',
          });

          if (result === DialogueStateResult.Rejected) {
            ExecutorInterrupter.interrupt(contexts);
          }
        }
      },
    ],
  });

  return <UserProfileForm state={state} />;
});
