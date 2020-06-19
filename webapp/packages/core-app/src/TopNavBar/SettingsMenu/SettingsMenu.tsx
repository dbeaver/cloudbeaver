/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useStyles } from '@cloudbeaver/core-theming';

import { topMenuStyles } from '../shared/topMenuStyles';
import { SettingsMenuService } from './SettingsMenuService';
import { settingsMenuStyles } from './settingsMenuStyles';

export const SettingsMenu = observer(function SettingsMenu() {
  const settingsMenuService = useService(SettingsMenuService);

  return styled(useStyles(settingsMenuStyles))(
    <MenuTrigger panel={settingsMenuService.getMenu()} style={[topMenuStyles, settingsMenuStyles]}>
      <Icon name="settings" viewBox="0 0 28 28" />
    </MenuTrigger>
  );
});
