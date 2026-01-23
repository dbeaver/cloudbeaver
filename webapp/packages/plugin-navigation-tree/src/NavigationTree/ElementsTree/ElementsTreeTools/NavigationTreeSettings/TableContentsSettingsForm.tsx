/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, type PlaceholderElement, Switch, useTranslate } from '@cloudbeaver/core-blocks';

import type { IElementsTreeSettingsProps } from './ElementsTreeSettingsService.js';

export const TableContentsSettingsForm: PlaceholderComponent<IElementsTreeSettingsProps> = observer(function TableContentsSettingsForm({
  tree: { root, settings },
}) {
  const translate = useTranslate();

  if (!settings) {
    return null;
  }

  return (
    <Switch
      id={`${root}.showTableContents`}
      name="showTableContents"
      state={settings}
      disabled={!settings.configurable}
      title={translate('plugin_navigation_tree_settings_filter_table_contents')}
      mod={['primary', 'dense']}
      small
    >
      {translate('plugin_navigation_tree_settings_filter_table_contents')}
    </Switch>
  );
});

export const TableContentsSettingsPlaceholderElement: PlaceholderElement<IElementsTreeSettingsProps> = {
  id: 'settings-table-contents',
  component: TableContentsSettingsForm,
};
