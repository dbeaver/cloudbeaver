/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { UserInfoResource, UsersResource } from '@cloudbeaver/core-authentication';
import { TextPlaceholder, Loader, ExceptionMessage, BASE_CONTAINERS_STYLES, ColoredContainer, ObjectPropertyInfoForm, Group, useAutoLoad, useObjectRef, IAutoLoadable, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminUserInfo, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { AuthenticationProvider, TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import { getOriginTabId } from './getOriginTabId';
import type { IUserFormProps } from './UserFormService';

interface IInnerState extends IAutoLoadable {
  state: IState;
  user: AdminUserInfo;
}

interface IState {
  properties: ObjectPropertyInfo[];
  state: Record<string, any>;
  loading: boolean;
  loaded: boolean;
  exception: Error | null;
}

export const OriginInfoPanel: TabContainerPanelComponent<IUserFormProps> = observer(function OriginInfoPanel({
  tabId,
  user,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const usersResource = useService(UsersResource);
  const userInfoService = useService(UserInfoResource);
  const state = useTabState<IState>(() => ({
    origin: null,
    properties: [],
    state: {},
    loading: false,
    loaded: false,
    exception: null,
  }));

  let origin = user.origins.find(origin => getOriginTabId('origin', origin) === tabId);

  if (!origin) {
    origin = user.origins[0];
  }

  const providerId = origin.subType ?? origin.type;
  const authorized = userInfoService.hasToken(providerId);

  const loadableState = useObjectRef<IInnerState>(() => ({
    get exception(): Error | null {
      return this.state.exception;
    },
    isLoaded(): boolean {
      return this.state.loaded;
    },
    isLoading(): boolean {
      return this.state.loading;
    },
    async load(reload = false) {
      if ((this.state.loaded && !reload) || this.state.loading) {
        return;
      }

      this.state.loading = true;
      this.state.exception = null;

      try {
        usersResource.markOutdated(this.user.userId);
        const userOrigin = await usersResource.load(this.user.userId, ['customIncludeOriginDetails']);

        let origin = userOrigin.origins.find(origin => getOriginTabId('origin', origin) === tabId);

        if (!origin) {
          origin = user.origins[0];
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
  }), {
    state,
    user,
  }, ['reload', 'load', 'isLoaded', 'isLoading']);

  const { selected } = useTab(tabId);

  useAutoLoad(loadableState, selected && authorized);

  if (!selected) {
    return null;
  }

  if (state.loading) {
    return styled(style)(
      <ColoredContainer parent>
        <Group large>
          <Loader key="static" />
        </Group>
      </ColoredContainer>
    );
  }

  if (state.exception) {
    return styled(style)(
      <ColoredContainer parent>
        <Group large>
          <ExceptionMessage exception={state.exception} onRetry={() => loadableState.reload?.()} />
        </Group>
      </ColoredContainer>
    );
  }

  if (!authorized) {
    return styled(style)(
      <ColoredContainer parent>
        <Group large>
          <AuthenticationProvider providerId={providerId} onAuthenticate={() => loadableState.reload?.()} />
        </Group>
      </ColoredContainer>
    );
  }

  if (!origin || (state.loaded && state.properties.length === 0)) {
    return styled(style)(
      <ColoredContainer parent>
        <Group large>
          <TextPlaceholder>{translate('authentication_administration_user_origin_empty')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return styled(style)(
    <ColoredContainer parent>
      <Group gap large>
        <ObjectPropertyInfoForm
          properties={state.properties}
          state={state.state}
          readOnly
          small
          autoHide
        />
      </Group>
    </ColoredContainer>
  );
});
