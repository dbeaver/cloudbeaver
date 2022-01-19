/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled from 'reshadow';

import type { AdministrationItemDrawerProps } from '@cloudbeaver/core-administration';
import { Tab, TabTitle, TabIcon } from '@cloudbeaver/core-ui';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

export const WelcomeDrawerItem: React.FC<AdministrationItemDrawerProps> = function WelcomeDrawerItem({
  item, onSelect, style, disabled,
}) {
  return styled(useStyles(style))(
    <Tab tabId={item.name} disabled={disabled} onOpen={() => onSelect(item.name)}>
      <TabIcon icon='/icons/welcome_bold.svg' viewBox='0 0 16 16' />
      <TabTitle><Translate token='administration_configuration_wizard_welcome' /></TabTitle>
    </Tab>
  );
};
