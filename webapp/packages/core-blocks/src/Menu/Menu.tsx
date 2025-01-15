/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { MenuButton, type MenuInitialState, useMenuState } from 'reakit';
import type { ExtractHTMLAttributes } from 'reakit-utils';

import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { s } from '../s.js';
import { useCombinedRef } from '../useCombinedRef.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import style from './Menu.module.css';
import { MenuPanel } from './MenuPanel.js';
import { type IMenuState, MenuStateContext } from './MenuStateContext.js';
import type { IMouseContextMenu } from './useMouseContextMenu.js';

interface IMenuProps extends React.ButtonHTMLAttributes<any> {
  mouseContextMenu?: IMouseContextMenu;
  contextInputRef?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  label: string;
  items: React.ReactNode | (() => React.ReactNode);
  menuRef?: React.RefObject<IMenuState | undefined>;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  submenu?: boolean;
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  hasBindings?: boolean;
  panelAvailable?: boolean;
  getHasBindings?: () => boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}

const CONTEXT_INPUT_OFFSET_Y = 3;

export const Menu = observer<IMenuProps, HTMLButtonElement>(
  forwardRef(function Menu(
    {
      mouseContextMenu,
      label,
      items,
      menuRef,
      disclosure,
      children,
      placement,
      visible,
      hasBindings,
      panelAvailable,
      getHasBindings,
      onVisibleSwitch,
      modal,
      submenu,
      rtl,
      className,
      contextInputRef,
      ...props
    },
    ref,
  ) {
    const innerMenuButtonRef = useRef<HTMLButtonElement>(null);
    const combinedRef = useCombinedRef(ref, innerMenuButtonRef);
    const [relativePosition, setRelativePosition] = useState<{ x: number; y: number } | null>(null);
    const menuButtonLinkRef = useRef<HTMLButtonElement>(null);
    const menuPanelRef = useRef<HTMLDivElement>(null);
    const propsRef = useObjectRef({ onVisibleSwitch, visible });
    const menu = useMenuState({
      modal,
      placement,
      visible,
      rtl,
      unstable_fixed: true,
    });
    const styles = useS(style);
    const hasAnchorButton = isNotNullDefined(relativePosition) || isNotNullDefined(contextInputRef?.current);

    if (menuRef) {
      //@ts-expect-error Ref mutation
      menuRef.current = menu;
    }

    let menuVisible = menu.visible;

    if (panelAvailable === false) {
      menuVisible = false;
    }

    useLayoutEffect(() => {
      if (!menuVisible) {
        setRelativePosition(null);
      }

      propsRef.onVisibleSwitch?.(menuVisible);
    }, [menuVisible]);

    useLayoutEffect(() => {
      if (!mouseContextMenu?.position) {
        return;
      }

      if (menuVisible) {
        menu.hide();
        return;
      }

      if (innerMenuButtonRef.current) {
        menu.show();

        const boxSize = innerMenuButtonRef.current.getBoundingClientRect();
        setRelativePosition({
          x: mouseContextMenu.position.x - boxSize.x,
          y: mouseContextMenu.position.y - boxSize.y,
        });

        mouseContextMenu.position = null;
      }
    }, [mouseContextMenu?.position, menuVisible]);

    useLayoutEffect(() => {
      if (mouseContextMenu?.position && relativePosition && menuButtonLinkRef.current) {
        menuButtonLinkRef.current.style.left = `${relativePosition.x}px`;
        menuButtonLinkRef.current.style.top = `${relativePosition.y}px`;
      }
    });

    useLayoutEffect(() => {
      if (contextInputRef?.current && menuButtonLinkRef.current) {
        const span = document.createElement('span');
        span.style.position = 'absolute';
        span.style.visibility = 'hidden';
        span.style.whiteSpace = 'pre';
        span.style.fontFamily = window.getComputedStyle(contextInputRef.current).fontFamily;
        span.style.fontSize = window.getComputedStyle(contextInputRef.current).fontSize;
        span.textContent = contextInputRef.current.value;

        document.body.appendChild(span);
        const spanRect = span.getBoundingClientRect();
        const letterWidth = spanRect.width / contextInputRef.current.value.length;
        document.body.removeChild(span);

        menuButtonLinkRef.current.style.left = `${spanRect.width + letterWidth}px`;
        menuButtonLinkRef.current.style.top = `${spanRect.height + CONTEXT_INPUT_OFFSET_Y}px`;
      }
    }, [contextInputRef?.current?.value]);

    const MenuButtonLink = MenuButton;

    if (React.isValidElement(children) && disclosure) {
      return (
        <ErrorBoundary>
          <MenuStateContext.Provider value={menu}>
            <MenuButton
              key={relativePosition ? 'link' : 'main'}
              ref={combinedRef}
              tabIndex={0}
              className={s(styles, { menuButton: true }, className)}
              {...menu}
              visible={menuVisible}
              {...props}
              {...children.props}
            >
              {(disclosureProps: ExtractHTMLAttributes<any>) => React.cloneElement(children, { ...disclosureProps, ...children.props })}
            </MenuButton>
            <MenuPanel
              ref={menuPanelRef}
              label={label}
              menu={menu}
              rtl={rtl}
              submenu={submenu}
              panelAvailable={panelAvailable}
              hasBindings={hasBindings}
              getHasBindings={getHasBindings}
            >
              {items}
            </MenuPanel>
            {hasAnchorButton && (
              <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} {...menu} visible={menuVisible} />
            )}
          </MenuStateContext.Provider>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <MenuStateContext.Provider value={menu}>
          <MenuButton
            key={relativePosition ? 'link' : 'main'}
            ref={combinedRef}
            tabIndex={0}
            className={s(styles, { menuButton: true }, className)}
            {...menu}
            visible={menuVisible}
            {...props}
          >
            <div className={s(styles, { box: true }, className)}>{children}</div>
          </MenuButton>
          <MenuPanel
            ref={menuPanelRef}
            label={label}
            menu={menu}
            rtl={rtl}
            submenu={submenu}
            panelAvailable={panelAvailable}
            hasBindings={hasBindings}
            getHasBindings={getHasBindings}
          >
            {items}
          </MenuPanel>
          {hasAnchorButton && (
            <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} {...menu} visible={menuVisible} />
          )}
        </MenuStateContext.Provider>
      </ErrorBoundary>
    );
  }),
);
