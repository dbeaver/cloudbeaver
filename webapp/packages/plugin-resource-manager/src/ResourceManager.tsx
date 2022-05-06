/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { ResourceManagerTree } from './Tree/ResourceManagerTree';

const styles = css`
  container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

export const ResourceManager: TabContainerPanelComponent = observer(function ResourceManager() {
  return styled(styles)(
    <container>
      <ResourceManagerTree />
    </container>
  );
});