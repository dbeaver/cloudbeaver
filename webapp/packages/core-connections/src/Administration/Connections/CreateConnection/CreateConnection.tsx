/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  TabsState, TabList, IconButton, Loader, StaticImage, Icon, BORDER_TAB_STYLES, TabPanelList
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { ConnectionForm } from '../ConnectionForm/ConnectionForm';
import { IConnectionFormModel } from '../ConnectionForm/IConnectionFormModel';
import { CreateConnectionService } from '../CreateConnectionService';

const styles = composes(
  css`
    title-bar {
      composes: theme-border-color-background from global;
    }

    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }

    TabList {
      composes: theme-background-surface theme-text-on-surface from global;
    }

    connection-create-footer, connection-create-content {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    connection-create {
      display: flex;
      flex-direction: column;
      height: 556px;
      overflow: hidden;
    }

    connection-create-footer {
      padding-bottom: 48px;
      flex: auto 0 0;
    }

    connection-create-content {
      position: relative;
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;
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
      border-top: solid 1px;
      align-items: center;
      display: flex;
      font-weight: 400;
      flex: auto 0 0;
    }

    IconButton {
      color: rgba(0, 0, 0, 0.45);
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
  `
);

interface Props {
  method: string | null | undefined;
  configurationWizard: boolean;
}

export const CreateConnection = observer(function CreateConnection({
  method,
  configurationWizard,
}: Props) {
  const style = useStyles(styles);
  const service = useService(CreateConnectionService);
  const translate = useTranslate();

  if (service.connection) {
    return styled(style)(
      <connection-create as='div'>
        <title-bar as='div'>
          <back-button as='div'><Icon name="angle" viewBox="0 0 15 8" onClick={service.clearConnectionTemplate} /></back-button>
          {service.driver?.icon && <StaticImage icon={service.driver.icon} />}
          {service.driver?.name ?? translate('connections_administration_connection_create')}
          <fill as="div" />
          <IconButton name="cross" viewBox="0 0 24 24" onClick={service.cancelCreate} />
        </title-bar>
        <connection-create-content as='div'>
          <ConnectionForm
            model={service as IConnectionFormModel}
            onBack={service.clearConnectionTemplate}
            onCancel={service.clearConnectionTemplate}
          />
        </connection-create-content>
        <connection-create-footer as='div' />
      </connection-create>
    );
  }

  return styled(style, BORDER_TAB_STYLES)(
    <connection-create as='div'>
      <TabsState
        currentTabId={method}
        container={service.tabsContainer}
        manual
        lazy
        onChange={({ tabId }) => service.setCreateMethod(tabId)}
      >
        <title-bar as='div'>
          {translate('connections_administration_connection_create')}
          <fill as="div" />
          <IconButton name="cross" viewBox="0 0 16 16" onClick={service.cancelCreate} />
        </title-bar>
        <TabList style={[style, BORDER_TAB_STYLES]} />
        <connection-create-content as='div'>
          <TabPanelList style={[style, BORDER_TAB_STYLES]} />
          {service.disabled && <Loader overlay />}
        </connection-create-content>
        <connection-create-footer as='div' />
      </TabsState>
    </connection-create>
  );
});
