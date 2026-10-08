/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { useCallback, useEffect } from 'react';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog, useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import type { AiDeviceAuthorizationInfo } from '@cloudbeaver/core-sdk';
import type { IFormState } from '@cloudbeaver/core-ui';

import { AIProfilesResource } from '../AIProfilesResource.js';
import { AIProfileAuthorizationService } from './AIProfileAuthorizationService.js';
import type { IAIProfileCredentialsFormState } from './IAIProfileCredentialsFormState.js';

export interface IAIProfileAuthorizationState {
  authorization: AiDeviceAuthorizationInfo | null;
  task: ITask<boolean> | null;
  readonly processing: boolean;
  connect(): Promise<void>;
  cancel(): Promise<void>;
  confirmLeave(): Promise<boolean>;
}

export function useAIProfileAuthorization(formState: IFormState<IAIProfileCredentialsFormState> | null): IAIProfileAuthorizationState {
  const service = useService(AIProfileAuthorizationService);
  const profiles = useService(AIProfilesResource);
  const notifications = useService(NotificationService);
  const dialogs = useService(CommonDialogService);
  const user = useService(UserInfoResource);
  const state = useObservableRef(
    () => ({
      authorization: null as AiDeviceAuthorizationInfo | null,
      task: null as ITask<boolean> | null,
      get processing(): boolean {
        return this.task?.executing ?? false;
      },
      async connect(): Promise<void> {
        if (!this.formState || this.task?.executing) {
          return;
        }
        const profileId = this.formState.state.profileId;
        const task = service.authorize(profileId, info => {
          this.authorization = info;
        });
        this.task = task;
        try {
          if (await task) {
            notifications.logSuccess({ title: 'plugin_ai_account_connected', message: profiles.get(profileId)?.name });
          }
        } catch (exception: any) {
          if (!task.cancelled) {
            notifications.logException(exception, 'plugin_ai_device_failed');
          }
        } finally {
          if (this.task === task) {
            this.task = null;
            this.authorization = null;
          }
        }
      },
      async cancel(): Promise<void> {
        if (this.task?.executing && !this.task.cancelled) {
          await this.task.cancel();
        }
      },
      async confirmLeave(): Promise<boolean> {
        if (!this.task?.executing || this.task.cancelled) {
          return true;
        }
        const { status } = await dialogs.open(ConfirmationDialog, {
          title: 'plugin_ai_device_cancel_title',
          message: 'plugin_ai_device_cancel_confirmation',
          confirmActionText: 'plugin_ai_device_cancel',
          cancelActionText: 'plugin_ai_device_continue',
        });
        if (status !== DialogueStateResult.Resolved) {
          return false;
        }
        try {
          await this.cancel();
          return true;
        } catch (exception: any) {
          notifications.logException(exception, 'plugin_ai_device_cancel_failed');
          return false;
        }
      },
    }),
    { authorization: observable.ref, task: observable.ref, processing: computed },
    { formState },
    ['connect', 'cancel', 'confirmLeave'],
  );

  const cancel = useCallback(async (): Promise<void> => {
    try {
      await state.cancel();
    } catch (exception: any) {
      notifications.logException(exception, 'plugin_ai_device_cancel_failed');
    }
  }, [state, notifications]);

  useExecutor({ executor: user.onUserChange, handlers: [cancel] });
  useEffect(() => {
    formState?.disposeTask.addHandler(cancel);
    return () => {
      formState?.disposeTask.removeHandler(cancel);
      void cancel();
    };
  }, [formState, cancel]);

  return state;
}
