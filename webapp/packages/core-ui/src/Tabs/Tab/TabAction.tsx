/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import TabStyle from './Tab.module.css';
import style from './TabActions.module.css';

interface Props {
  iconName: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const TabAction = observer(function TabAction({ iconName, title, onClick }: Props) {
  const styles = useS(TabStyle, style);
  const translate = useTranslate();

  return (
    <button type="button" className={s(styles, { tabAction: true })} title={translate(title)} onClick={onClick}>
      <Icon className={s(styles, { icon: true })} name={iconName} viewBox="0 0 7 8" />
    </button>
  );
});
