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
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { FormMode, type TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { userProfileContext } from '../userProfileContext.js';
import { UserProfileOptionsPanelService } from '../UserProfileOptionsPanelService.js';
import { UserProfileForm } from './UserProfileForm.js';
import { UserProfileFormService } from './UserProfileFormService.js';
import { UserProfileFormState } from './UserProfileFormState.js';

export const UserProfileFormPanel: TabContainerPanelComponent = observer(function UserProfileFormPanel({ tabId }) {
  const serviceProvider = useService(IServiceProvider);
  const userProfileFormService = useService(UserProfileFormService);
  const userProfileOptionsPanelService = useService(UserProfileOptionsPanelService);
  const commonDialogService = useService(CommonDialogService);

  const [state] = useState(() => {
    const state = new UserProfileFormState(serviceProvider, userProfileFormService, {});
    state.setMode(FormMode.Edit);

    return state;
  });

  useExecutor({
    executor: userProfileOptionsPanelService.onClose,
    handlers: [
      async function closeHandler(_, contexts) {
        const context = contexts.getContext(userProfileContext);

        if (state.isChanged && !context.force) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'plugin_connections_connection_edit_cancel_title',
            message: 'plugin_connections_connection_edit_cancel_message',
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
