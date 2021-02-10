/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ObjectPageTabProps } from '../ObjectPage/ObjectPage';

export const ObjectPropertiesPageTab = observer(function ObjectPropertiesPageTab({
  page, onSelect, style,
}: ObjectPageTabProps) {
  return styled(useStyles(style))(
    <Tab tabId={page.key} style={style} onOpen={onSelect}>
      <TabIcon icon='/icons/properties.svg' viewBox="0 0 16 16" />
      <TabTitle>Properties</TabTitle>
    </Tab>
  );
});
