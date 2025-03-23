/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, useResource } from '@cloudbeaver/core-blocks';
import { Tab, type TabContainerTabComponent, TabTitle } from '@cloudbeaver/core-ui';

import type { IConnectionFormProps } from '../IConnectionFormState.js';
import { ConnectionInfoOriginResource } from '@cloudbeaver/core-connections';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
export const OriginInfoTab: TabContainerTabComponent<IConnectionFormProps> = observer(function OriginInfoTab({ formState, ...rest }) {
  const optionsPart = getConnectionFormOptionsPart(formState);
  const connectionInfoOriginResource = useResource(OriginInfoTab, ConnectionInfoOriginResource, optionsPart.connectionKey, {
    active: !!optionsPart.connectionKey,
  });

  return (
    <Tab {...rest}>
      <TabTitle>
        <Translate token={connectionInfoOriginResource.data?.origin?.displayName || 'Origin'} />
      </TabTitle>
    </Tab>
  );
});
