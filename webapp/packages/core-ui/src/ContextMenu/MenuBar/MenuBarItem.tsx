/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { type ButtonHTMLAttributes } from 'react';

import { Icon, IconOrImage, Loader, registry, s, useS, useStateDelay, useTranslate } from '@cloudbeaver/core-blocks';

import style from './MenuBarItem.module.css';
import menuBarGroupStyles from './MenuBarGroup.module.css';

export interface MenuBarItemProps extends Omit<React.DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'style'> {
  label?: string;
  onlyIcons?: boolean;
  tooltip?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  displaySubmenuMark?: boolean;
  binding?: string;
  ref?: React.ForwardedRef<HTMLButtonElement>;
}

export const MenuBarItem = registry(
  observer<MenuBarItemProps>(function MenuBarItem({
    label,
    tooltip,
    binding,
    onlyIcons,
    loading = false,
    icon,
    displaySubmenuMark,
    className,
    ref,
    ...rest
  }) {
    const styles = useS(style, menuBarGroupStyles);
    const translate = useTranslate();
    loading = useStateDelay(loading, 300);

    label = translate(label);
    tooltip = translate(tooltip) || (!onlyIcons ? undefined : label);
    tooltip = binding ? `${tooltip || label} (${binding})` : tooltip;
    const selected = rest['aria-selected'] === 'true';
    const tabIndex = selected ? 0 : -1;

    return (
      <button ref={ref} className={s(styles, { menuBarItem: true }, className)} tabIndex={tabIndex} {...rest} title={tooltip} aria-label={tooltip}>
        <div className={s(styles, { menuBarItemBox: true })}>
          {loading ? (
            <div className={s(styles, { menuBarItemIcon: true })}>
              <Loader className={s(styles, { loader: true })} small fullSize />
            </div>
          ) : (
            icon && (
              <div className={s(styles, { menuBarItemIcon: true })}>
                <Loader className={s(styles, { loader: true })} suspense small fullSize>
                  {typeof icon === 'string' ? <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} viewBox="0 0 24 24" /> : icon}
                </Loader>
              </div>
            )
          )}
          {label && !onlyIcons && <div className={s(styles, { menuBarItemLabel: true })}>{label}</div>}
          {displaySubmenuMark && (
            <div className={s(styles, { menuBarItemMark: true })}>
              <Icon className={s(styles, { icon: true })} name="angle" viewBox="0 0 15 8" />
            </div>
          )}
        </div>
      </button>
    );
  }),
);
