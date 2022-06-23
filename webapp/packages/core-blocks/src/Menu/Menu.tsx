/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { MenuButton, MenuInitialState, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { useObjectRef } from '../useObjectRef';
import { MenuPanel } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';
import { IMenuState, MenuStateContext } from './MenuStateContext';

interface IMenuProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  label: string;
  items: React.ReactNode | (() => React.ReactNode);
  menuRef?: React.RefObject<IMenuState | undefined>;
  style?: ComponentStyle;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  hasBindings?: boolean;
  panelAvailable?: boolean;
  getHasBindings?: () => boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}

export const Menu = observer<IMenuProps, HTMLButtonElement>(function Menu({
  label,
  items,
  menuRef,
  disclosure,
  children,
  style,
  placement,
  visible,
  hasBindings,
  panelAvailable,
  getHasBindings,
  onVisibleSwitch,
  modal,
  rtl,
  ...props
}, ref) {
  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const styles = useStyles(menuPanelStyles, style);

  if (menuRef) {
  //@ts-expect-error Ref mutation
    menuRef.current = menu;
  }

  useEffect(() => {
    propsRef.onVisibleSwitch?.(menu.visible);
  }, [menu.visible]);


  if (React.isValidElement(children) && disclosure) {
    return styled(styles)(
      <MenuStateContext.Provider value={menu}>
        <MenuButton ref={ref} {...menu} {...props} {...children.props}>
          {disclosureProps => React.cloneElement(children, { ...disclosureProps, ...children.props })}
        </MenuButton>
        <MenuPanel
          label={label}
          menu={menu}
          style={style}
          rtl={rtl}
          panelAvailable={panelAvailable}
          hasBindings={hasBindings}
          getHasBindings={getHasBindings}
        >
          {items}
        </MenuPanel>
      </MenuStateContext.Provider>
    );
  }

  return styled(styles)(
    <MenuStateContext.Provider value={menu}>
      <MenuButton ref={ref} {...menu} {...props}>
        <box>{children}</box>
      </MenuButton>
      <MenuPanel
        label={label}
        menu={menu}
        style={style}
        rtl={rtl}
        panelAvailable={panelAvailable}
        hasBindings={hasBindings}
        getHasBindings={getHasBindings}
      >
        {items}
      </MenuPanel>
    </MenuStateContext.Provider>
  );
}, { forwardRef: true });