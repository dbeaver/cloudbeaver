/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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

interface IMenuItemElementProps {
  label: string;
  /** @deprecated must be refactored (#1)*/
  displayLabel?: boolean;
  tooltip?: string;
  binding?: string;
  icon?: React.ReactNode;
  menu?: boolean;
  loading?: boolean;
  panelAvailable?: boolean;
}

export const MenuItemElement = observer<IMenuItemElementProps>(function MenuItemElement({
  label,
  displayLabel = true,
  tooltip,
  binding,
  icon,
  menu,
  panelAvailable,
  loading = false,
}) {
  const styles = useS(style);
  const translate = useTranslate();

  const title = translate(label);
  loading = useStateDelay(loading, 300);

  return (
    <div className={s(styles, { menuPanelItem: true })} title={tooltip ? translate(tooltip) : title}>
      <div className={s(styles, { menuItemIcon: true })}>
        <Loader className={s(styles, { loader: true })} suspense small fullSize>
          {typeof icon === 'string' ? <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} /> : icon}
        </Loader>
      </div>
      {displayLabel ? (
        <div className={s(styles, { menuItemText: true })} title={title}>
          {title}
        </div>
      ) : (
        <div />
      )}
      <div className={s(styles, { menuItemBinding: true })} title={binding}>
        {binding}
      </div>
      <div className={s(styles, { menuItemContent: true })}>
        {loading && <Loader className={s(styles, { loader: true })} small fullSize />}
        {panelAvailable !== false && menu && !loading && <Icon name="context-menu-submenu" viewBox="0 0 6 7" className={s(styles, { icon: true })} />}
      </div>
    </div>
  );
});
