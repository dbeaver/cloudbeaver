/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { IMenuItem } from '@cloudbeaver/core-dialogs';

import { Checkbox } from '../FormControls/Checkboxes/Checkbox';
import { Radio } from '../FormControls/Radio';
import { Icon } from '../Icon';
import { IconOrImage } from '../IconOrImage';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { s } from '../s';
import { useS } from '../useS';
import MenuPanelItemAndTriggerStyles from './shared/MenuPanelItemAndTrigger.m.css';

interface MenuPanelItemProps {
  menuItem: IMenuItem;
  className?: string;
}

export const MenuPanelItem = observer<MenuPanelItemProps>(function MenuPanelItem({ menuItem }) {
  const translate = useTranslate();
  const style = useS(MenuPanelItemAndTriggerStyles);

  const title = translate(menuItem.title);
  let control = null;

  if (menuItem.type === 'radio') {
    control = <Radio checked={menuItem.isChecked} mod={['primary', 'menu']} ripple={false} />;
  } else if (menuItem.type === 'checkbox') {
    control = <Checkbox checked={menuItem.isChecked} mod={['primary', 'small']} ripple={false} />;
  }

  return (
    <div className={s(style, { menuPanelItem: true, separator: menuItem.separator })}>
      <div className={s(style, { menuItemContent: true })}>
        {menuItem.icon ? <IconOrImage className={s(style, { iconOrImage: true })} icon={menuItem.icon} /> : control}
      </div>
      <div className={s(style, { menuItemText: true })} title={title}>
        {title}
      </div>
      <div className={s(style, { menuItemContent: true })}>
        {menuItem.panel &&
          (menuItem.isProcessing ? (
            <Loader className={s(style, { loader: true })} small fullSize />
          ) : (
            <Icon className={s(style, { icon: true })} name="arrow" viewBox="0 0 16 16" />
          ))}
      </div>
    </div>
  );
});
