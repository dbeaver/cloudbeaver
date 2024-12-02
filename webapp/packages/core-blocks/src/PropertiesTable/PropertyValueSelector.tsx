/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { Menu, MenuButton, MenuItem, useMenuState } from 'reakit';

import { BaseDropdownStyles } from '../index.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './PropertyValueSelector.module.css';

interface Props {
  propertyName?: string;
  values: string[];
  container: HTMLDivElement | null;
  className?: string;
  onSelect: (value: string) => void;
  onSwitch: (state: boolean) => void;
}

export const PropertyValueSelector = observer<React.PropsWithChildren<Props>>(function PropertyValueSelector({
  propertyName,
  values,
  container,
  children,
  className,
  onSelect,
  onSwitch,
}) {
  const styles = useS(classes, BaseDropdownStyles);
  const menuRef = useRef<HTMLDivElement>(null);
  const menu = useMenuState({
    placement: 'bottom-end',
    gutter: 4,
  });
  const handleMenuSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      menu.hide();
      onSelect(event.currentTarget.id);
    },
    [menu, onSelect],
  );
  useEffect(() => onSwitch(menu.visible), [menu.visible]);

  useEffect(() => {
    if (!container) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const containerSize = container.getBoundingClientRect();
      if (menuRef.current && containerSize !== undefined) {
        // 1px offset of MenuButton
        menuRef.current.style.width = containerSize.width - 1 + 'px';
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  const visible = menu.visible;

  return (
    <>
      <MenuButton {...menu} className={s(styles, { menuButton: true }, className)} visible={visible}>
        {children}
      </MenuButton>
      <Menu className={s(styles, { menu: true })} {...menu} ref={menuRef} visible={visible} aria-label={propertyName} modal>
        {visible &&
          values.map(value => (
            <MenuItem key={value} className={s(styles, { menuItem: true })} id={value} type="button" {...menu} onClick={handleMenuSelect}>
              {value}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
});
