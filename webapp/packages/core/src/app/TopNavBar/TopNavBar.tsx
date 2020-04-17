/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { SessionService } from '@dbeaver/core/root';
import { useStyles } from '@dbeaver/core/theming';

import { ConnectionSelector } from './ConnectionSchemaManager/ConnectionSelector/ConnectionSelector';
import { MainMenu } from './MainMenu/MainMenu';
import { SettingsMenu } from './SettingsMenu/SettingsMenu';
import { topNavBarStyles } from './topNavBarStyles';


declare const version: string; // declared in webpack DefinePlugin // todo move to enviroment?

export const TopNavBar = observer(function TopNavBar() {
  const sessionService = useService(SessionService);
  const title = `Frontend: ${version}\nBackend: ${sessionService.version}`;

  return styled(useStyles(topNavBarStyles))(
    <header>
      <logo as="div" title={title}>
        <Icon name="logo" viewBox="0 0 361 73" />
      </logo>
      <MainMenu />
      <ConnectionSelector/>
      <SettingsMenu />
    </header>
  );
});
