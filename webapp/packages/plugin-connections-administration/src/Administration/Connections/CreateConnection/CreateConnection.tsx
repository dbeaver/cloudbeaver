/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Fill, Icon, IconButton, Loader, s, SContext, StaticImage, StyleRegistry, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { TabListStyles, TabPanelList, TabPanelStyles, TabsState, TabStyles, TabUnderlineStyles } from '@cloudbeaver/core-ui';
import { ConnectionFormLoader } from '@cloudbeaver/plugin-connections';

import { CreateConnectionService } from '../CreateConnectionService';
import styles from './shared/CreateConnection.m.css';
import CreateConnectionTab from './shared/CreateConnectionTab.m.css';
import CreateConnectionTabList from './shared/CreateConnectionTabList.m.css';
import CreateConnectionTabPanel from './shared/CreateConnectionTabPanel.m.css';

interface Props {
  method: string | null | undefined;
  configurationWizard: boolean;
}

const tabsRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [TabUnderlineStyles, CreateConnectionTab] }],
  [TabPanelStyles, { mode: 'append', styles: [CreateConnectionTabPanel] }],
  [TabListStyles, { mode: 'append', styles: [CreateConnectionTabList] }],
];

export const CreateConnection = observer<Props>(function CreateConnection({ method }) {
  const style = useS(styles);
  const createConnectionService = useService(CreateConnectionService);
  const translate = useTranslate();
  const driver = useResource(CreateConnection, DBDriverResource, createConnectionService.data?.config.driverId || null);

  if (createConnectionService.data) {
    return (
      <div className={s(style, { connectionCreate: true })}>
        <div className={s(style, { titleBar: true })}>
          <div className={s(style, { backButton: true })}>
            <Icon className={s(style, { icon: true })} name="angle" viewBox="0 0 15 8" onClick={createConnectionService.clearConnectionTemplate} />
          </div>
          {driver.data?.icon && <StaticImage className={s(style, { staticImage: true })} icon={driver.data.icon} />}
          {driver.data?.name ?? translate('connections_administration_connection_create')}
          <div className={s(style, { fill: true })} />
          <IconButton name="cross" viewBox="0 0 24 24" onClick={createConnectionService.cancelCreate} />
        </div>
        <div className={s(style, { connectionCreateContent: true })}>
          <Loader className={s(style, { loader: true })} suspense>
            <ConnectionFormLoader
              state={createConnectionService.data}
              onCancel={createConnectionService.clearConnectionTemplate}
              onSave={createConnectionService.clearConnectionTemplate}
            />
          </Loader>
        </div>
      </div>
    );
  }

  return (
    <SContext registry={tabsRegistry}>
      <div className={s(style, { connectionCreate: true })}>
        <TabsState
          currentTabId={method}
          container={createConnectionService.tabsContainer}
          manual
          lazy
          onChange={({ tabId }) => createConnectionService.setCreateMethod(tabId)}
        >
          <div className={s(style, { titleBar: true })}>
            {translate('connections_administration_connection_create')}
            <div className={s(style, { fill: true })} />
            <IconButton name="cross" viewBox="0 0 16 16" onClick={createConnectionService.cancelCreate} />
          </div>
          <div className={s(style, { connectionCreateContent: true })}>
            <TabPanelList />
            {createConnectionService.disabled && <Loader overlay />}
          </div>
        </TabsState>
      </div>
    </SContext>
  );
});
