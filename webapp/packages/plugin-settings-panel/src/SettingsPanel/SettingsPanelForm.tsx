/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { SettingsManagerService } from '@cloudbeaver/core-settings';

import { SettingsGroup } from './SettingsGroup';

const styles = css`
  ColoredContainer {
    height: 100%;
  }
`;

export const SettingsPanelForm = observer(function SettingsPanelForm() {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);

  const settingsManagerService = useService(SettingsManagerService);
  const groups = Array.from(settingsManagerService.groups);

  return styled(style)(
    <ColoredContainer gap overflow parent>
      <Container medium gap vertical overflow>
        {groups.map(([_, group]) => (
          <SettingsGroup key={group.id} group={group} />
        ))}
      </Container>
    </ColoredContainer>,
  );
});
