/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { NavigationTreeLoader } from './NavigationTreeLoader';

const styles = css`
  container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

export const NavigationTreePanel: TabContainerPanelComponent = observer(function NavigationTreePanel() {
  return styled(styles)(
    <container>
      <NavigationTreeLoader />
    </container>,
  );
});
