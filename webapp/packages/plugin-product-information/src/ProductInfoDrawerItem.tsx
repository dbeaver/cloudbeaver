/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';

export const LicenseDrawerItem: React.FC<AdministrationItemDrawerProps> = function LicenseDrawerItem({ item, onSelect, disabled }) {
  return (
    <Tab tabId={item.name} disabled={disabled} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/license.svg" viewBox="0 0 16 16" />
      <TabTitle>
        <Translate token="administration_settings_menu_title" />
      </TabTitle>
    </Tab>
  );
};
