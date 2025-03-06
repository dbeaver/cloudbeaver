/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate } from '@cloudbeaver/core-blocks';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormPropsRefactored } from '../IConnectionFormStateRefactored.js';
import { ConnectionInfoOriginResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

export const OriginInfoTab: TabContainerTabComponent<IConnectionFormPropsRefactored> = observer(function OriginInfoTab({ formState, ...rest }) {
  const connectionInfoOriginService = useService(ConnectionInfoOriginResource);
  // TODO useResource?
  const info = connectionInfoOriginService.get(createConnectionParam(formState.state.projectId, formState.state.config.connectionId!));

  return (
    <Tab {...rest}>
      <TabTitle>
        <Translate token={info?.origin?.displayName || 'Origin'} />
      </TabTitle>
    </Tab>
  );
});
