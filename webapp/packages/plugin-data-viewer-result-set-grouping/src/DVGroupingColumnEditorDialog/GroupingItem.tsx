/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useId } from 'react';

import { Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { IconButton } from '@dbeaver/ui-kit';

import styles from './GroupingColumnEditor.module.css';

interface Props {
  name: string;
  onDelete: (name: string) => void;
}

export const GroupingItem = observer<Props>(function GroupingItem({ name, onDelete }) {
  const style = useS(styles);
  const translate = useTranslate();
  const nameId = useId();
  const removeId = useId();

  return (
    <li className={s(style, { item: true })}>
      <span id={nameId} className={s(style, { itemName: true })}>
        {name}
      </span>
      <IconButton
        id={removeId}
        size="small"
        aria-label={translate('ui_remove')}
        aria-labelledby={`${removeId} ${nameId}`}
        onClick={() => onDelete(name)}
      >
        <Icon name="cross-bold" width={16} height={16} />
      </IconButton>
    </li>
  );
});
