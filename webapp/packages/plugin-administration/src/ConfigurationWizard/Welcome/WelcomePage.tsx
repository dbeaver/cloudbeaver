/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ColoredContainer, Group, GroupItem, s, Translate, useS } from '@cloudbeaver/core-blocks';

import styles from './WelcomePage.module.css';

export const WelcomePage: React.FC = function WelcomePage() {
  const style = useS(styles);

  return (
    <ColoredContainer wrap gap overflow parent>
      <Group form>
        <h3 className="tw:text-xl tw:font-semibold">
          <Translate token="administration_configuration_wizard_welcome_title" />
        </h3>
        <GroupItem>
          <p className={s(style, { p: true })}>
            <Translate token="administration_configuration_wizard_welcome_message" />
          </p>
          <div className={s(style, { note: true })}>
            <Translate token="administration_configuration_wizard_welcome_note" />
          </div>
        </GroupItem>
      </Group>
    </ColoredContainer>
  );
};
