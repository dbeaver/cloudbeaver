/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { type HTMLAttributes, forwardRef } from 'react';

import { Icon, IconOrImage, Loader, registry, s, useS, useStateDelay, useTranslate } from '@cloudbeaver/core-blocks';

import style from './MenuBarItem.module.css';

export interface MenuBarItemProps extends Omit<React.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>, 'style'> {
  label?: string;
  /** @deprecated must be refactored (#1)*/
  displayLabel?: boolean;
  loading?: boolean;
  hidden?: boolean;
  icon?: string | React.ReactNode;
  submenu?: React.FC<React.PropsWithChildren>;
  displaySubmenuMark?: boolean;
  viewBox?: string;
}

export const MenuBarItem = registry(
  observer<MenuBarItemProps, HTMLDivElement>(
    forwardRef(function MenuBarItem(
      { label, displayLabel = true, loading = false, hidden, icon, submenu, displaySubmenuMark, viewBox = '0 0 24 24', className, ...rest },
      ref,
    ) {
      const styles = useS(style);
      const translate = useTranslate();
      loading = useStateDelay(loading, 100);

      const title = translate(rest.title);
      const Submenu = submenu;
      const selected = rest['aria-selected'] === 'true';
      // 'disabled' is not a valid prop for div, so we check for aria-disabled instead
      const disabled = rest['aria-disabled'] === 'true';
      const tabIndex = selected ? 0 : -1;

      return (
        <div
          className={s(styles, { menuBarItemGroup: true, hidden, disabled }, className)}
          aria-selected={rest['aria-selected']}
          aria-disabled={rest['aria-disabled']}
        >
          <div ref={ref} className={s(styles, { menuBarItem: true })} tabIndex={tabIndex} {...rest} title={title} aria-label={title} role="menuitem">
            <div className={s(styles, { menuBarItemBox: true })}>
              {loading ? (
                <div className={s(styles, { menuBarItemIcon: true })}>
                  <Loader className={s(styles, { loader: true })} small fullSize />
                </div>
              ) : (
                icon && (
                  <div className={s(styles, { menuBarItemIcon: true })}>
                    <Loader className={s(styles, { loader: true })} suspense small fullSize>
                      {typeof icon === 'string' ? <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} viewBox={viewBox} /> : icon}
                    </Loader>
                  </div>
                )
              )}
              {label && displayLabel && <div className={s(styles, { menuBarItemLabel: true })}>{translate(label)}</div>}
              {displaySubmenuMark && (
                <div className={s(styles, { menuBarItemMark: true })}>
                  <Icon className={s(styles, { icon: true })} name="angle" viewBox="0 0 15 8" />
                </div>
              )}
            </div>
          </div>
          {Submenu && (
            <Submenu>
              <div className={s(styles, { menuBarItemCustomSubmenuMark: true })}>
                <Icon className={s(style, { icon: true })} name="arrow" viewBox="0 0 16 16" />
              </div>
            </Submenu>
          )}
        </div>
      );
    }),
  ),
);
