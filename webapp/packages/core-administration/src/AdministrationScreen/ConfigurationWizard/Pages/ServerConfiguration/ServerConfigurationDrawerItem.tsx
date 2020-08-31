/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import { Tab, TabTitle, TabIcon } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { AdministrationItemDrawerProps } from '../../../../AdministrationItem/IAdministrationItem';

export function ServerConfigurationDrawerItem({
  item, onSelect, style, disabled,
}: AdministrationItemDrawerProps) {
  return styled(useStyles(...style))(
    <Tab tabId={item.name} onOpen={() => onSelect(item.name)} disabled={disabled}>
      <TabIcon icon='/icons/cog-outline.svg' />
      <TabTitle><Translate token='administration_configuration_wizard_configuration'/></TabTitle>
    </Tab>
  );
}
