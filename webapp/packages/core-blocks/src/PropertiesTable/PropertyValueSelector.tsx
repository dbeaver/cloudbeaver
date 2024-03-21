/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import { Menu, MenuButton, MenuItem, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import { BASE_DROPDOWN_STYLES } from '../FormControls/BASE_DROPDOWN_STYLES';
import { s } from '../s';
import { useS } from '../useS';
import classes from './PropertyValueSelector.m.css';

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
  const styles = useS(classes);
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

  return styled(BASE_DROPDOWN_STYLES)(
    <>
      <MenuButton {...menu} className={s(styles, { menuButton: true }, className)} visible={visible}>
        {children}
      </MenuButton>
      <Menu {...menu} ref={menuRef} visible={visible} aria-label={propertyName} modal>
        {visible &&
          values.map(value => (
            <MenuItem key={value} id={value} type="button" {...menu} onClick={handleMenuSelect}>
              {value}
            </MenuItem>
          ))}
      </Menu>
    </>,
  );
});
