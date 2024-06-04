/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { ROOT_SETTINGS_GROUP, type SettingsGroup } from '@cloudbeaver/core-settings';

import style from './SettingsGroupTitle.module.css';

interface Props {
  group: SettingsGroup;
}

export const SettingsGroupTitle = observer<Props>(function SettingsGroupTitle({ group }) {
  const translate = useTranslate();
  const styles = useS(style);
  return (
    <div className={s(styles, { box: true })}>
      {group.parent && group.parent !== ROOT_SETTINGS_GROUP && (
        <>
          <SettingsGroupTitle group={group.parent} />
          <Icon name="arrow" className={s(styles, { icon: true })} viewBox="0 0 16 16" />
        </>
      )}
      <div>{translate(group.name)}</div>
    </div>
  );
});
