/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { ResourceManagerTree } from '@cloudbeaver/plugin-resource-manager';

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
  const serverConfigResource = useResource(ResourceManagerScripts, ServerConfigResource, undefined);
  const resourceTypeId = (
    serverConfigResource.resource.distributed
      ? SCRIPTS_TYPE_ID
      : undefined
  );
  return styled(styles)(
    <container>
      <ResourceManagerTree resourceTypeId={resourceTypeId}>
        {translate('plugin_resource_manager_scripts_no_resources_placeholder')}
      </ResourceManagerTree>
    </container>
  );
});