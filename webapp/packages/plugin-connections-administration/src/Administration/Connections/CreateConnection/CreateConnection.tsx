/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconButton, Loader, StaticImage, Icon, useMapResource } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsState, TabList, UNDERLINE_TAB_STYLES, TabPanelList, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { ConnectionForm } from '@cloudbeaver/plugin-connections';

import { CreateConnectionService } from '../CreateConnectionService';

const styles = css`
    title-bar {
      composes: theme-border-color-background from global;
    }

    connection-create {
      display: flex;
      flex-direction: column;
      height: 700px;
      overflow: hidden;
    }

    connection-create-content {
      composes: theme-background-secondary theme-text-on-secondary from global;
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
    }

    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
      height: 46px!important;
      text-transform: uppercase;
      font-weight: 500 !important;
    }

    TabList {
      composes: theme-border-color-background theme-background-secondary theme-text-on-secondary from global;
      border-top: solid 1px;
      position: relative;
      flex-shrink: 0;
      align-items: center;

      &:before {
        content: '';
        position: absolute;
        bottom: 0;
        width: 100%;
        border-bottom: solid 2px;
        border-color: inherit;
      }
    }

    TabPanel, CustomConnection, SearchDatabase {
      flex-direction: column;
      height: 100%;
      overflow: auto;
    }

    Loader {
      z-index: 1;
    }

    title-bar {
      composes: theme-typography--headline6 from global;
      padding: 16px 24px;
      align-items: center;
      display: flex;
      font-weight: 400;
      flex: auto 0 0;
    }

    StaticImage {
      width: 32px;
      max-height: 32px;
      margin-right: 16px;
    }

    fill {
      flex: 1;
    }

    back-button {
      position: relative;
      box-sizing: border-box;
      margin-right: 16px;
      display: flex;

      & Icon {
        box-sizing: border-box;
        transform: rotate(90deg);
        cursor: pointer;
        height: 16px;
        width: 16px;
      }
    }
  `;

const componentStyle = [BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES];

interface Props {
  method: string | null | undefined;
  configurationWizard: boolean;
}

export const CreateConnection = observer<Props>(function CreateConnection({
  method,
}) {
  const style = useStyles(componentStyle);
  const createConnectionService = useService(CreateConnectionService);
  const translate = useTranslate();
  const driver = useMapResource(
    CreateConnection,
    DBDriverResource,
    createConnectionService.data?.config.driverId || null
  );

  if (createConnectionService.data) {
    return styled(style)(
      <connection-create>
        <title-bar>
          <back-button><Icon name="angle" viewBox="0 0 15 8" onClick={createConnectionService.clearConnectionTemplate} /></back-button>
          {driver.data?.icon && <StaticImage icon={driver.data.icon} />}
          {driver.data?.name ?? translate('connections_administration_connection_create')}
          <fill />
          <IconButton name="cross" viewBox="0 0 24 24" onClick={createConnectionService.cancelCreate} />
        </title-bar>
        <connection-create-content>
          <ConnectionForm
            state={createConnectionService.data}
            onCancel={createConnectionService.clearConnectionTemplate}
            onSave={createConnectionService.clearConnectionTemplate}
          />
        </connection-create-content>
      </connection-create>
    );
  }

  return styled(style)(
    <connection-create>
      <TabsState
        currentTabId={method}
        container={createConnectionService.tabsContainer}
        manual
        lazy
        onChange={({ tabId }) => createConnectionService.setCreateMethod(tabId)}
      >
        <title-bar>
          {translate('connections_administration_connection_create')}
          <fill />
          <IconButton name="cross" viewBox="0 0 16 16" onClick={createConnectionService.cancelCreate} />
        </title-bar>
        <TabList style={componentStyle} />
        <connection-create-content>
          <TabPanelList style={componentStyle} />
          {createConnectionService.disabled && <Loader overlay />}
        </connection-create-content>
      </TabsState>
    </connection-create>
  );
});
