/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Flex, useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { ResourceManagerTree } from '@cloudbeaver/plugin-navigation-tree-rm';

import { SCRIPTS_TYPE_ID } from './SCRIPTS_TYPE_ID.js';

export const ResourceManagerScripts: TabContainerPanelComponent = observer(function ResourceManagerScripts() {
  const translate = useTranslate();

  return (
    <Flex direction="column" overflow>
      <ResourceManagerTree resourceTypeId={SCRIPTS_TYPE_ID}>
        {translate('plugin_resource_manager_scripts_no_resources_placeholder')}
      </ResourceManagerTree>
    </Flex>
  );
});
