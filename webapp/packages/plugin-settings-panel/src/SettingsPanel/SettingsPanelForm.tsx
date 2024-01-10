/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import { ColoredContainer, Container, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { SettingsManagerService } from '@cloudbeaver/core-settings';

import { SettingsGroup } from './SettingsGroup';
import styles from './SettingsPanelForm.m.css';

export const SettingsPanelForm = observer(function SettingsPanelForm() {
  const style = useS(styles);

  const settingsManagerService = useService(SettingsManagerService);
  const groups = Array.from(settingsManagerService.groups.values());

  return (
    <div className={s(style, { content: true })}>
      <ColoredContainer gap overflow parent>
        <Container medium gap vertical overflow>
          {groups.map(group => (
            <SettingsGroup key={group.id} group={group} />
          ))}
        </Container>
      </ColoredContainer>
    </div>
  );
});
