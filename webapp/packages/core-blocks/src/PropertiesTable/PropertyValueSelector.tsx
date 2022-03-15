/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef } from 'react';
import {
  useMenuState,
  Menu,
  MenuItem,
  MenuButton
} from 'reakit/Menu';
import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { BASE_DROPDOWN_STYLES } from '../FormControls/BASE_DROPDOWN_STYLES';

const styles = css`
  MenuButton {
    composes: theme-ripple from global;
    background: transparent;
    outline: none;
    padding: 4px;
    cursor: pointer;
  }
`;

interface Props {
  propertyName?: string;
  values: string[];
  container: HTMLDivElement | null;
  className?: string;
  onSelect: (value: string) => void;
  onSwitch: (state: boolean) => void;
}

export const PropertyValueSelector = observer<Props>(function PropertyValueSelector({
  propertyName,
  values,
  container,
  children,
  className,
  onSelect,
  onSwitch,
}) {
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
    [menu, onSelect]
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
        menuRef.current.style.width = (containerSize.width - 1) + 'px';
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [container]);

  const visible = menu.visible;

  return styled(useStyles(BASE_DROPDOWN_STYLES, styles))(
    <>
      <MenuButton {...menu} className={className} visible={visible}>{children}</MenuButton>
      <Menu {...menu} ref={menuRef} visible={visible} aria-label={propertyName} modal>
        {visible && values.map(value => (
          <MenuItem key={value} id={value} type='button' {...menu} onClick={handleMenuSelect}>
            {value}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});
