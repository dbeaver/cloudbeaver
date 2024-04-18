/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  ActionIconButton,
  Container,
  Group,
  GroupClose,
  GroupTitle,
  Loader,
  s,
  SContext,
  StaticImage,
  StyleRegistry,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { TabListStyles, TabPanelList, TabPanelStyles, TabsState, TabStyles, TabUnderlineStyleRegistry } from '@cloudbeaver/core-ui';
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
  ...TabUnderlineStyleRegistry,
  [TabStyles, { mode: 'append', styles: [CreateConnectionTab] }],
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
      <Group className={s(style, { connectionCreate: true })} vertical box boxNoOverflow noWrap>
        <GroupTitle keepSize>
          <Container gap dense noWrap>
            <Container keepSize>
              <ActionIconButton
                name="angle"
                viewBox="0 0 15 8"
                className={s(style, { backButton: true })}
                onClick={createConnectionService.clearConnectionTemplate}
              />
            </Container>
            <Container keepSize center>
              {driver.data?.icon && <StaticImage className={s(style, { staticImage: true })} icon={driver.data.icon} />}
            </Container>
            <Container keepSize center>
              {translate('connections_administration_connection_create')}
            </Container>
          </Container>
          <GroupClose onClick={createConnectionService.cancelCreate} />
        </GroupTitle>
        <Container overflow>
          <Loader className={s(style, { loader: true })} suspense>
            <ConnectionFormLoader
              state={createConnectionService.data}
              onCancel={createConnectionService.clearConnectionTemplate}
              onSave={createConnectionService.clearConnectionTemplate}
            />
          </Loader>
        </Container>
      </Group>
    );
  }

  return (
    <Group className={s(style, { connectionCreate: true })} vertical box boxNoOverflow noWrap>
      <TabsState
        currentTabId={method}
        container={createConnectionService.tabsContainer}
        manual
        lazy
        onChange={({ tabId }) => createConnectionService.setCreateMethod(tabId)}
      >
        <GroupTitle keepSize>
          {translate('connections_administration_connection_create')}
          <GroupClose onClick={createConnectionService.cancelCreate} />
        </GroupTitle>
        <Container overflow>
          <SContext registry={tabsRegistry}>
            <TabPanelList />
          </SContext>
          {createConnectionService.disabled && <Loader overlay />}
        </Container>
      </TabsState>
    </Group>
  );
});
