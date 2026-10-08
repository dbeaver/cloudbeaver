/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileAuthorizationController } from './AIProfileAuthorizationController.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

const CONTROLLER = createDataContext<AIProfileAuthorizationController>('ai-profile-authorization-controller');

export function getAIProfileAuthorizationController(formState: IFormState<IAIProfileCredentialsFormState>): AIProfileAuthorizationController {
  let controller = formState.dataContext.get(CONTROLLER);
  if (!controller) {
    const di = formState.dataContext.get(DATA_CONTEXT_DI_PROVIDER)!;
    controller = new AIProfileAuthorizationController(
      formState.state.profileId,
      di.getService(CommonDialogService),
      di.getService(NotificationService),
      di.getService(AIProfilesResource),
      di.getService(AsyncTaskInfoService),
    );
    const user = di.getService(UserInfoResource);
    const dispose = controller.dispose.bind(controller);
    user.onUserChange.addHandler(dispose);
    formState.disposeTask.addHandler(async () => {
      user.onUserChange.removeHandler(dispose);
      await dispose();
    });
    formState.dataContext.set(CONTROLLER, controller, formState.id);
  }
  return controller;
}
