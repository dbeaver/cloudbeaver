/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Translate, useStyles } from '@cloudbeaver/core-blocks';
import { Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';

export const ConnectionsDrawerItem: React.FC<AdministrationItemDrawerProps> = function ConnectionsDrawerItem({
  item,
  onSelect,
  style,
  disabled,
  configurationWizard,
}) {
  return styled(useStyles(style))(
    <Tab tabId={item.name} disabled={disabled} onOpen={() => onSelect(item.name)}>
      <TabIcon icon="/icons/connection.svg" />
      <TabTitle>
        <Translate token={configurationWizard ? 'connections_administration_configuration_wizard_step_title' : 'connections_administration_item'} />
      </TabTitle>
    </Tab>,
  );
};
