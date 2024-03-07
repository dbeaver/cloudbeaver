/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate } from '@cloudbeaver/core-blocks';
import { TabIcon, Tab, TabTitle } from '@cloudbeaver/core-ui';

export const UsersDrawerItem: React.FC<AdministrationItemDrawerProps> = function UsersDrawerItem({ item, onSelect, disabled }) {
  return (
    <Tab tabId={item.name} disabled={disabled} title="authentication_administration_item" onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/account.svg" />
      <TabTitle>
        <Translate token="authentication_administration_item" />
      </TabTitle>
    </Tab>
  );
};
