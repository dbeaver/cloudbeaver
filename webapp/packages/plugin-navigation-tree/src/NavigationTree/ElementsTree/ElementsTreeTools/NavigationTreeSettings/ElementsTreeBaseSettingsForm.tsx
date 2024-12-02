/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { GroupTitle, type PlaceholderComponent, Switch, useTranslate } from '@cloudbeaver/core-blocks';

import type { IElementsTreeSettingsProps } from './ElementsTreeSettingsService.js';

export const ElementsTreeBaseSettingsForm: PlaceholderComponent<IElementsTreeSettingsProps> = observer(function ElementsTreeBaseSettingsForm({
  tree: { root, settings },
}) {
  const translate = useTranslate();

  if (!settings) {
    return null;
  }

  return (
    <>
      <GroupTitle>{translate('ui_settings')}</GroupTitle>
      <Switch
        id={`${root}.filter`}
        name="filter"
        state={settings}
        disabled={!settings.configurable}
        title={translate('app_navigationTree_settings_filter_description')}
        mod={['primary', 'dense']}
        small
      >
        {translate('app_navigationTree_settings_filter_title')}
      </Switch>
      <Switch
        id={`${root}.filterAll`}
        name="filterAll"
        state={settings}
        disabled={!settings.filter || !settings.configurable}
        title={translate('app_navigationTree_settings_filter_all_description')}
        mod={['primary', 'dense']}
        small
      >
        {translate('app_navigationTree_settings_filter_all_title')}
      </Switch>
      <Switch
        id={`${root}.saveExpanded`}
        name="saveExpanded"
        state={settings}
        disabled={!settings.configurable}
        title={translate('app_navigationTree_settings_state_description')}
        mod={['primary', 'dense']}
        small
      >
        {translate('app_navigationTree_settings_state_title')}
      </Switch>
      <Switch
        id={`${root}.foldersTree`}
        name="foldersTree"
        state={settings}
        disabled={!settings.configurable}
        title={translate('app_navigationTree_settings_folders_description')}
        mod={['primary', 'dense']}
        small
      >
        {translate('app_navigationTree_settings_folders_title')}
      </Switch>
    </>
  );
});
