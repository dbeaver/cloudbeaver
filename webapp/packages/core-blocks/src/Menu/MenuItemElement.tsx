/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon } from '../Icon.js';
import { IconOrImage } from '../IconOrImage.js';
import { Loader } from '../Loader/Loader.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { useStateDelay } from '../useStateDelay.js';
import style from './MenuItemElement.module.css';
import type { HTMLAttributes } from 'react';

export interface IMenuItemGroupArrowElementProps extends HTMLAttributes<HTMLButtonElement> {}

export interface IMenuItemGroupElementProps extends HTMLAttributes<HTMLDivElement> {}

export interface IMenuItemElementProps extends HTMLAttributes<HTMLButtonElement> {
  label: string;
  onlyIcons?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  displaySubmenuMark?: boolean;
  binding?: string;
}

export const MenuItemElement = observer<IMenuItemElementProps>(function MenuItemElement({
  label,
  onlyIcons,
  tooltip,
  binding,
  icon,
  displaySubmenuMark,
  loading = false,
  ...rest
}) {
  const styles = useS(style);
  const translate = useTranslate();

  const title = translate(label);
  loading = useStateDelay(loading, 300);

  return (
    <button {...rest} className={s(styles, { menuPanelItem: true }, rest.className)} title={translate(tooltip)}>
      <div className={s(styles, { menuItemMain: true })}>
        <div className={s(styles, { menuItemIcon: true })}>
          <Loader className={s(styles, { loader: true })} suspense small fullSize>
            {typeof icon === 'string' ? <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} /> : icon}
          </Loader>
        </div>
        {!onlyIcons ? <div className={s(styles, { menuItemText: true })}>{title}</div> : <div />}
        <div className={s(styles, { menuItemBinding: true })} title={binding}>
          {binding}
        </div>
      </div>

      <div className={s(styles, { menuItemContent: true })}>
        {loading && <Loader className={s(styles, { loader: true })} small fullSize />}
        {displaySubmenuMark && !loading && <Icon name="context-menu-submenu" viewBox="0 0 6 7" className={s(styles, { icon: true })} />}
      </div>
    </button>
  );
});
