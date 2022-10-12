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



export const TeamsDrawerItem: React.FC<AdministrationItemDrawerProps> = function TeamsDrawerItem({
  item,
  onSelect,
  style,
  disabled,
}) {
  return styled(useStyles(style))(
    <Tab
      tabId={item.name}
      disabled={disabled}
      title='administration_teams_tab_title'
      onOpen={() => onSelect(item.name)}
    >
      <TabIcon icon='/icons/tab_team.svg' />
      <TabTitle><Translate token='administration_teams_tab_title' /></TabTitle>
    </Tab>
  );
};
