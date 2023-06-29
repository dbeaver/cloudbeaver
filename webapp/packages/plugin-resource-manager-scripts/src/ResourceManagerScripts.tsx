/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { ResourceManagerTree } from '@cloudbeaver/plugin-navigation-tree-rm';

import { SCRIPTS_TYPE_ID } from './SCRIPTS_TYPE_ID';

const styles = css`
  container {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

export const ResourceManagerScripts: TabContainerPanelComponent = observer(function ResourceManagerScripts() {
  const translate = useTranslate();

  return styled(styles)(
    <container>
      <ResourceManagerTree resourceTypeId={SCRIPTS_TYPE_ID}>
        {translate('plugin_resource_manager_scripts_no_resources_placeholder')}
      </ResourceManagerTree>
    </container>,
  );
});
