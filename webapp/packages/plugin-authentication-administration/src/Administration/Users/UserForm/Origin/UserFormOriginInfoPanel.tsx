/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  ExceptionMessage,
  Group,
  IAutoLoadable,
  Loader,
  ObjectPropertyInfoForm,
  TextPlaceholder,
  useAutoLoad,
  useObjectRef,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminUserInfo, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { FormMode, TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { UserFormProps } from '../AdministrationUserFormService';
import { getUserFormOriginTabId } from './getUserFormOriginTabId';

interface IInnerState extends IAutoLoadable {
  state: IState;
  user: AdminUserInfo | undefined;
}

interface IState {
  properties: ObjectPropertyInfo[];
  state: Record<string, any>;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
}

export const UserFormOriginInfoPanel: TabContainerPanelComponent<UserFormProps> = observer(function UserFormOriginInfoPanel({
  tabId,
  formState: { mode, state },
}) {
  const translate = useTranslate();
  const usersResource = useService(UsersResource);
  const localState = useTabState<IState>(() => ({
    origin: null,
    properties: [],
    state: {},
    loading: false,
    loaded: false,
    exception: null,
  }));
  const editing = mode === FormMode.Edit;
  const userInfo = useResource(UserFormOriginInfoPanel, UsersResource, state.userId, { active: editing });
  let origin = userInfo.data?.origins.find(origin => getUserFormOriginTabId('origin', origin) === tabId);

  if (!origin) {
    origin = userInfo.data?.origins[0];
  }

  const loadableState = useObjectRef<IInnerState>(
    () => ({
      get exception(): Error | null {
        return this.state.exception;
      },
      isError(): boolean {
        return !!this.state.exception;
      },
      isLoaded(): boolean {
        return this.state.loaded;
      },
      isLoading(): boolean {
        return this.state.loading;
      },
      async load(reload = false) {
        if ((this.state.loaded && !reload) || this.state.loading || !this.user) {
          return;
        }

        this.state.loading = true;
        this.state.exception = null;

        try {
          usersResource.markOutdated(this.user.userId);
          const userOrigin = await usersResource.load(this.user.userId, ['customIncludeOriginDetails']);

          let origin = userOrigin.origins.find(origin => getUserFormOriginTabId('origin', origin) === tabId);

          if (!origin) {
            origin = this.user.origins[0];
          }

          const propertiesState = {} as Record<string, any>;

          for (const property of origin.details!) {
            propertiesState[property.id!] = property.value;
          }
          this.state.properties = origin.details!;
          this.state.state = propertiesState;
          this.state.loaded = true;
        } catch (error: any) {
          this.state.exception = error;
        } finally {
          this.state.loading = false;
        }
      },
      async reload() {
        await this.load();
      },
    }),
    {
      state: localState,
      user: userInfo.data as AdminUserInfo | undefined,
    },
    ['reload', 'load', 'isLoaded', 'isLoading', 'isError'],
  );

  const { selected } = useTab(tabId);

  useAutoLoad(UserFormOriginInfoPanel, loadableState, selected);

  if (!selected) {
    return null;
  }

  if (localState.loading) {
    return (
      <ColoredContainer parent>
        <Group large>
          <Loader key="static" />
        </Group>
      </ColoredContainer>
    );
  }

  if (localState.exception) {
    return (
      <ColoredContainer parent>
        <Group large>
          <ExceptionMessage exception={localState.exception} onRetry={() => loadableState.reload?.()} />
        </Group>
      </ColoredContainer>
    );
  }

  if (!origin || (localState.loaded && localState.properties.length === 0)) {
    return (
      <ColoredContainer parent>
        <Group large>
          <TextPlaceholder>{translate('authentication_administration_user_origin_empty')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return (
    <ColoredContainer>
      <Group gap large>
        <ObjectPropertyInfoForm properties={localState.properties} state={localState.state} readOnly small autoHide />
      </Group>
    </ColoredContainer>
  );
});
