/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Translate, TreeNodeNestedMessage } from '@cloudbeaver/core-blocks';
import type { NodeEmptyPlaceholderComponent } from '@cloudbeaver/plugin-navigation-tree';

export const SettingsGroupsEmpty: NodeEmptyPlaceholderComponent = function SettingsGroupsEmpty({ root }) {
  return (
    <TreeNodeNestedMessage>
      <Translate token={root ? 'plugin_settings_panel_no_settings' : 'plugin_settings_panel_group_empty'} />
    </TreeNodeNestedMessage>
  );
};
