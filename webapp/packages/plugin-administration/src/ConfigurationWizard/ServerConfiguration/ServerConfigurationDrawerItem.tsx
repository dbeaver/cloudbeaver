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

export const ServerConfigurationDrawerItem: React.FC<AdministrationItemDrawerProps> = function ServerConfigurationDrawerItem({
  item,
  onSelect,
  disabled,
}) {
  return (
    <Tab tabId={item.name} disabled={disabled} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/server-configuration.svg" />
      <TabTitle>
        <Translate token="administration_configuration_wizard_configuration" />
      </TabTitle>
    </Tab>
  );
};
