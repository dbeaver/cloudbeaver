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

import type { IConnectionFormProps } from '../IConnectionFormProps.js';

export const OriginInfoTab: TabContainerTabComponent<IConnectionFormProps> = observer(function OriginInfoTab({ state: { originInfo }, ...rest }) {
  return (
    <Tab {...rest}>
      <TabTitle>
        <Translate token={originInfo?.origin?.displayName || 'Origin'} />
      </TabTitle>
    </Tab>
  );
});
