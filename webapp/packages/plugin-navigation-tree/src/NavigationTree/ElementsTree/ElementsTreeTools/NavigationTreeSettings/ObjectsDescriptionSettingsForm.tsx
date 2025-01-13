/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, type PlaceholderElement, Switch, useTranslate } from '@cloudbeaver/core-blocks';

import type { IElementsTreeSettingsProps } from './ElementsTreeSettingsService.js';

export const ObjectsDescriptionSettingsForm: PlaceholderComponent<IElementsTreeSettingsProps> = observer(function ObjectsDescriptionSettingsForm({
  tree: { root, settings },
}) {
  const translate = useTranslate();

  if (!settings) {
    return null;
  }

  return (
    <Switch
      id={`${root}.objectsDescription`}
      name="objectsDescription"
      state={settings}
      disabled={!settings.configurable}
      title={translate('app_navigationTree_settings_filter_objects_description')}
      mod={['primary', 'dense']}
      small
    >
      {translate('app_navigationTree_settings_filter_objects_description')}
    </Switch>
  );
});

export const ObjectsDescriptionSettingsPlaceholderElement: PlaceholderElement<IElementsTreeSettingsProps> = {
  id: 'settings-objects-description',
  component: ObjectsDescriptionSettingsForm,
  order: 2,
};
