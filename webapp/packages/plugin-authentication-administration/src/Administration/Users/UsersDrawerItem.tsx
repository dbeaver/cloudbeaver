/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate, useStyles } from '@cloudbeaver/core-blocks';
import { Tab, TabTitle, TabIcon } from '@cloudbeaver/core-ui';

export const UsersDrawerItem: React.FC<AdministrationItemDrawerProps> = function UsersDrawerItem({
  item,
  onSelect,
  style,
  disabled,
}) {
  return styled(useStyles(style))(
    <Tab
      tabId={item.name}
      disabled={disabled}
      title='authentication_administration_item'
      onOpen={() => onSelect(item.name)}
    >
      <TabIcon icon='/icons/account.svg' />
      <TabTitle><Translate token='authentication_administration_item' /></TabTitle>
    </Tab>
  );
};
