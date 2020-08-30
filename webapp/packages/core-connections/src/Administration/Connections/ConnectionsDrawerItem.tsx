/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Tab, TabTitle, TabIcon } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

export function ConnectionsDrawerItem({
  item, onSelect, style, disabled, configurationWizard,
}: AdministrationItemDrawerProps) {
  return styled(useStyles(...style))(
    <Tab tabId={item.name} onOpen={() => onSelect(item.name)} disabled={disabled}>
      <TabIcon icon='/icons/connection.svg' />
      <TabTitle><Translate token={configurationWizard ? 'connections_administration_configuration_wizard_step_title' : 'connections_administration_item'}/></TabTitle>
    </Tab>
  );
}
