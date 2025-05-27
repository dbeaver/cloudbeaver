/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Fragment } from 'react';

import { type AdminUserOrigin, UsersOriginDetailsResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Button,
  Combobox,
  ConfirmationDialog,
  Container,
  Group,
  GroupItem,
  ObjectPropertyInfoForm,
  useObservableRef,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { FormMode, type TabContainerPanelComponent, useTab } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService.js';

interface IState {
  selectedOrigin: string;
}

const empty: any[] = [];

export const UserFormOriginInfoPanel: TabContainerPanelComponent<UserFormProps> = observer(function UserFormOriginInfoPanel({
  tabId,
  formState: { mode, state },
}) {
  const translate = useTranslate();
  const editing = mode === FormMode.Edit;
  const localState = useObservableRef<IState>(
    () => ({
      selectedOrigin: '0',
    }),
    {
      selectedOrigin: observable.ref,
    },
    false,
  );
  const userInfoLoader = useResource(UserFormOriginInfoPanel, UsersResource, state.userId, {
    active: editing,
  });
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const origins = userInfoLoader.data?.origins ?? [];
  const origin: AdminUserOrigin | undefined = origins[localState.selectedOrigin as any];
  const usersOriginDetailsResource = useResource(UserFormOriginInfoPanel, UsersOriginDetailsResource, state.userId, {
    active: editing,
  });
  const originDetails = usersOriginDetailsResource.data?.origins?.[localState.selectedOrigin as any]?.details ?? [];

  const { selected } = useTab(tabId);

  if (!selected) {
    return null;
  }

  if (!origin && origins.length > 0) {
    localState.selectedOrigin = '0';
  }

  async function deleteHandler() {
    const result = await commonDialogService.open(ConfirmationDialog, {
      title: 'ui_data_delete_confirmation',
      message: translate('authentication_administration_user_delete_credentials_confirmation_message', undefined, {
        originName: origin?.displayName,
        userId: state.userId,
      }),
      confirmActionText: 'ui_delete',
    });

    if (result !== DialogueStateResult.Rejected) {
      try {
        await userInfoLoader.resource.deleteCredentials(state.userId!, origin!.type!);
        notificationService.logSuccess({ title: 'authentication_administration_user_delete_credentials_success' });
      } catch (exception: any) {
        notificationService.logException(exception, 'authentication_administration_user_delete_credentials_error');
      }
    }
  }

  return (
    <Container>
      <Group gap medium overflow>
        <Combobox
          state={localState}
          name="selectedOrigin"
          items={origins}
          keySelector={(o, i) => String(i)}
          valueSelector={origin => origin.displayName}
          disabled={origins.length === 0}
          tiny
        >
          {translate('authentication_administration_user_auth_method')}
        </Combobox>
        {origins.length === 0 && <GroupItem>{translate('authentication_administration_user_auth_methods_empty')}</GroupItem>}
        {origin && (
          <Fragment>
            <Container gap>
              <Container gap keepSize>
                <ObjectPropertyInfoForm
                  properties={originDetails || empty}
                  emptyPlaceholder="authentication_administration_user_auth_method_no_details"
                  readOnly
                  small
                  autoHide
                />
              </Container>
            </Container>
            <GroupItem>
              <Button type="button" variant="secondary" onClick={deleteHandler}>
                {translate('ui_delete')}
              </Button>
            </GroupItem>
          </Fragment>
        )}
      </Group>
    </Container>
  );
});
