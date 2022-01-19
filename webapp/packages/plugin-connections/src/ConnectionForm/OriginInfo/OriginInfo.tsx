/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { TextPlaceholder, Loader, ExceptionMessage, useMapResource, ColoredContainer, Group, ObjectPropertyInfoForm, BASE_CONTAINERS_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabContainerPanelComponent, AuthenticationProvider, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormProps';

const style = css`
  Loader {
    height: 100%;
  }
  ColoredContainer {
    flex: 1;
    overflow: auto;
  }
`;

export const OriginInfo: TabContainerPanelComponent<IConnectionFormProps> = observer(function OriginInfo({
  tabId,
  state: {
    info,
    resource,
  },
}) {
  const tab = useTab(tabId);
  const translate = useTranslate();
  const userInfoService = useService(UserInfoResource);
  const state = useTabState<Record<string, any>>();
  const styles = useStyles(style, BASE_CONTAINERS_STYLES);

  const connection = useMapResource(OriginInfo, resource, {
    key: tab.selected ? info!.id : null,
    includes: ['includeOrigin', 'customIncludeOriginDetails'],
  }, {
    isActive: () => !info?.origin || userInfoService.hasOrigin(info.origin),
    onData: (connection, res, prev) => {
      if (!connection.origin.details) {
        return;
      }

      if (prev?.origin.details) {
        for (const property of prev.origin.details) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete state[property.id!];
        }
      }

      for (const property of connection.origin.details) {
        state[property.id!] = property.value;
      }
    },
  }
  );

  if (connection.isLoading()) {
    return styled(styles)(
      <ColoredContainer>
        <Loader key="static" />
      </ColoredContainer>
    );
  }

  if (connection.exception) {
    return styled(styles)(
      <ColoredContainer>
        <ExceptionMessage exception={connection.exception} onRetry={connection.reload} />
      </ColoredContainer>
    );
  }

  const authorized = !info?.origin || userInfoService.hasOrigin(info.origin);

  if (!authorized && info?.origin) {
    return styled(styles)(
      <ColoredContainer parent vertical>
        <AuthenticationProvider origin={info.origin} onAuthenticate={connection.reload} />
      </ColoredContainer>
    );
  }

  if (!connection.data?.origin.details || connection.data.origin.details.length === 0) {
    return styled(styles)(
      <ColoredContainer parent>
        <TextPlaceholder>{translate('connections_administration_connection_no_information')}</TextPlaceholder>
      </ColoredContainer>
    );
  }

  return styled(styles)(
    <ColoredContainer parent>
      <Group large gap>
        <ObjectPropertyInfoForm
          properties={connection.data.origin.details}
          state={state}
          readOnly
          small
          autoHide
        />
      </Group>
      <Loader key="overlay" loading={connection.isLoading()} overlay />
    </ColoredContainer>
  );
});
