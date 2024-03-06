/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useTranslate } from '@cloudbeaver/core-blocks';
import { TabIcon, TabNew, TabTitle } from '@cloudbeaver/core-ui';

import type { ObjectPageTabComponent } from '../ObjectPage/ObjectPage';

export const ObjectPropertiesPageTab: ObjectPageTabComponent = observer(function ObjectPropertiesPageTab({ page, onSelect }) {
  const translate = useTranslate();
  return (
    <TabNew tabId={page.key} onOpen={onSelect}>
      <TabIcon icon="/icons/properties.svg" viewBox="0 0 16 16" />
      <TabTitle>{translate('plugin_object_viewer_properties_tab')}</TabTitle>
    </TabNew>
  );
});
