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
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';

export const ServerConfigurationDrawerItem: React.FC<AdministrationItemDrawerProps> = function ServerConfigurationDrawerItem({
  item,
  onSelect,
  style,
  disabled,
}) {
  return styled(useStyles(style))(
    <Tab tabId={item.name} disabled={disabled} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/cog-outline.svg" />
      <TabTitle>
        <Translate token="administration_configuration_wizard_configuration" />
      </TabTitle>
    </Tab>,
  );
};
