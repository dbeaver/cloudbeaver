/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { ConnectionFormRefactoredProps } from '../ConnectionFormServiceRefactored.js';
import { ConnectionInfoOriginResource, createConnectionParam } from '@cloudbeaver/core-connections';

export const OriginInfoTab: TabContainerTabComponent<ConnectionFormRefactoredProps> = observer(function OriginInfoTab({ formState, ...rest }) {
  const originInfo = useResource(
    OriginInfoTab,
    ConnectionInfoOriginResource,
    createConnectionParam(formState.state.projectId, formState.state.config.connectionId!),
  );

  return (
    <Tab {...rest}>
      <TabTitle>
        <Translate token={originInfo.data?.origin?.displayName || 'Origin'} />
      </TabTitle>
    </Tab>
  );
});
