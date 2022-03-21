/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { AUTH_PROVIDER_LOCAL_ID, UserInfoResource, UsersResource } from '@cloudbeaver/core-authentication';
import { TextPlaceholder, Loader, ExceptionMessage, BASE_CONTAINERS_STYLES, ColoredContainer, ObjectPropertyInfoForm, Group } from '@cloudbeaver/core-blocks';
import { TabContainerPanelComponent, useTab, useTabState, AuthenticationProvider } from '@cloudbeaver/core-ui';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { getOriginTabId } from './getOriginTabId';
import type { IUserFormProps } from './UserFormService';

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

  const authorized = userInfoService.hasOrigin(origin);

  const load = async () => {
    if (state.loaded || !origin || !userInfoService.hasOrigin(origin)) {
      return;
    }
    state.loading = true;
    state.exception = null;

    try {
      const userOrigin = await usersResource.load(user.userId, ['customIncludeOriginDetails']);
      const propertiesState = {} as Record<string, any>;

      let origin = userOrigin.origins.find(origin => origin.type !== AUTH_PROVIDER_LOCAL_ID);

      if (!origin) {
        origin = userOrigin.origins[0];
      }

      for (const property of origin.details!) {
        propertiesState[property.id!] = property.value;
      }
      state.properties = origin.details!;
      state.state = propertiesState;
      state.loaded = true;
    } catch (error: any) {
      state.exception = error;
    } finally {
      state.loading = false;
    }
  };

  const { selected } = useTab(tabId, load);

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
          <ExceptionMessage exception={state.exception} onRetry={load} />
        </Group>
      </ColoredContainer>
    );
  }

  if (!authorized) {
    return styled(style)(
      <ColoredContainer parent>
        <Group large>
          <AuthenticationProvider origin={origin} onAuthenticate={load} />
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
