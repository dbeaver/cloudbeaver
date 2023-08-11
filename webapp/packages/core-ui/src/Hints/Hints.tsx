/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback } from 'react';
import { Menu, MenuButton, MenuItem, MenuStateReturn } from 'reakit/Menu';

import { Icon, IconOrImage, s, useS } from '@cloudbeaver/core-blocks';

import style from './Hints.m.css';
import type { Hint } from './useHints';

interface Props {
  menu: MenuStateReturn;
  hints: Hint[];
  ref?: React.Ref<HTMLDivElement>;
  propertyName?: string;
  onSelect?: (id: string, value: string) => void;
}

type EditorHintsType = (props: Props, ref: React.Ref<HTMLDivElement>) => React.ReactElement | null;

export const Hints: EditorHintsType = observer(
  forwardRef(function Hints({ menu, hints, propertyName, onSelect }: Props, ref: React.Ref<HTMLDivElement>) {
    const styles = useS(style);

    const handleSelect = useCallback(
      (id: any, value: any) => {
        menu.hide();

        if (onSelect) {
          onSelect(id, value);
        }
      },
      [menu, onSelect],
    );

    return (
      <>
        <MenuButton {...menu} className={styles.menuButton}>
          <Icon name="arrow" viewBox="0 0 16 16" className={s(styles, { icon: true })} />
        </MenuButton>
        <Menu {...menu} ref={ref} aria-label={propertyName} className={styles.menu} modal>
          {hints.map(item => (
            <MenuItem
              key={item.key}
              id={item.key}
              type="button"
              title={item.title}
              {...menu}
              className={styles.menuItem}
              onClick={event => handleSelect(event.currentTarget.id, event.currentTarget.value)}
            >
              {item.icon && (
                <div data-testid="item-icon" className={styles.itemIcon}>
                  {item.icon && typeof item.icon === 'string' ? <IconOrImage icon={item.icon} className={styles.iconOrImage} /> : item.icon}
                </div>
              )}
              <div data-testid="item-value" className={styles.itemValue}>
                {item.value}
              </div>
            </MenuItem>
          ))}
        </Menu>
      </>
    );
  }),
);
