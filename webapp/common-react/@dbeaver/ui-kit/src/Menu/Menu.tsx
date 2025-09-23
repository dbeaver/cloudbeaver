/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MenuProvider as AriaMenuProvider,
  Menu as AriaMenu,
  MenuButton as AriaMenuButton,
  MenuButtonArrow as AriaMenuButtonArrow,
  MenuItem as AriaMenuItem,
  MenuSeparator as AriaMenuSeparator,
  MenuHeading as AriaMenuHeading,
  MenuDescription as AriaMenuDescription,
  MenuDismiss as AriaMenuDismiss,
  MenuGroup as AriaMenuGroup,
  MenuGroupLabel as AriaMenuGroupLabel,
  MenuItemCheckbox as AriaMenuItemCheckbox,
  MenuItemRadio as AriaMenuItemRadio,
  type MenuProviderProps,
  type MenuProps,
  type MenuButtonProps,
  type MenuItemProps,
  type MenuSeparatorProps,
  type MenuHeadingProps,
  type MenuDescriptionProps,
  type MenuDismissProps,
  type MenuGroupProps,
  type MenuGroupLabelProps,
  type MenuItemCheckboxProps,
  type MenuItemRadioProps,
  useMenuStore,
  useMenuContext,
  useStoreState,
  type MenuStoreProps,
  type MenuArrowProps,
  MenuItemCheck,
} from '@ariakit/react';
import clsx from 'clsx';

import './Menu.css';
import type { ReactElement } from 'react';

export function MenuProvider({ children, ...props }: MenuProviderProps): ReactElement {
  return <AriaMenuProvider {...props}>{children}</AriaMenuProvider>;
}

export function MenuButton({ className, ...props }: MenuButtonProps): ReactElement {
  return <AriaMenuButton className={clsx('dbv-kit-menu__button', className)} {...props} />;
}

export function MenuButtonArrow({ className, ...props }: MenuArrowProps): ReactElement {
  return <AriaMenuButtonArrow className={clsx('dbv-kit-menu__button-arrow', className)} {...props} />;
}

export function Menu({ children, className, ...props }: MenuProps): ReactElement {
  return (
    <AriaMenu className={clsx('dbv-kit-menu__popover', className)} portal={props.portal ?? true} gutter={props.gutter ?? 4} {...props}>
      {children}
    </AriaMenu>
  );
}

export function MenuItem({ children, className, ...props }: MenuItemProps): ReactElement {
  return (
    <AriaMenuItem className={clsx('dbv-kit-menu__item', className)} {...props}>
      {children}
    </AriaMenuItem>
  );
}

export function MenuSeparator({ className, ...props }: MenuSeparatorProps): ReactElement {
  return <AriaMenuSeparator className={clsx('dbv-kit-menu__separator', className)} {...props} />;
}

export function MenuHeading({ children, className, ...props }: MenuHeadingProps): ReactElement {
  return (
    <AriaMenuHeading className={clsx('dbv-kit-menu__heading', className)} {...props}>
      {children}
    </AriaMenuHeading>
  );
}

export function MenuDescription({ children, className, ...props }: MenuDescriptionProps): ReactElement {
  return (
    <AriaMenuDescription className={clsx('dbv-kit-menu__description', className)} {...props}>
      {children}
    </AriaMenuDescription>
  );
}

export function MenuDismiss({ className, ...props }: MenuDismissProps): ReactElement {
  return <AriaMenuDismiss className={clsx('dbv-kit-menu__dismiss', className)} {...props} />;
}

export function MenuGroup({ children, className, ...props }: MenuGroupProps): ReactElement {
  return (
    <AriaMenuGroup className={clsx('dbv-kit-menu__group', className)} {...props}>
      {children}
    </AriaMenuGroup>
  );
}

export function MenuGroupLabel({ children, className, ...props }: MenuGroupLabelProps): ReactElement {
  return (
    <AriaMenuGroupLabel className={clsx('dbv-kit-menu__group-label', className)} {...props}>
      {children}
    </AriaMenuGroupLabel>
  );
}

export function MenuItemCheckbox({ children, className, ...props }: MenuItemCheckboxProps): ReactElement {
  return (
    <AriaMenuItemCheckbox className={clsx('dbv-kit-menu__item dbv-kit-menu__item--checkbox', className)} {...props}>
      <MenuItemCheck />
      {children}
    </AriaMenuItemCheckbox>
  );
}

export function MenuItemRadio({ children, className, ...props }: MenuItemRadioProps): ReactElement {
  return (
    <AriaMenuItemRadio className={clsx('dbv-kit-menu__item dbv-kit-menu__item--radio', className)} {...props}>
      <MenuItemCheck />
      {children}
    </AriaMenuItemRadio>
  );
}

export {
  useMenuStore,
  useStoreState,
  useMenuContext,
  type MenuProviderProps,
  type MenuProps,
  type MenuButtonProps,
  type MenuItemProps,
  type MenuSeparatorProps,
  type MenuHeadingProps,
  type MenuDescriptionProps,
  type MenuDismissProps,
  type MenuGroupProps,
  type MenuGroupLabelProps,
  type MenuItemCheckboxProps,
  type MenuItemRadioProps,
  type MenuStoreProps,
  type MenuArrowProps,
};

Menu.Provider = MenuProvider;
Menu.Button = MenuButton;
Menu.Item = MenuItem;
Menu.Separator = MenuSeparator;
Menu.Heading = MenuHeading;
Menu.Description = MenuDescription;
Menu.Dismiss = MenuDismiss;
Menu.Group = MenuGroup;
Menu.GroupLabel = MenuGroupLabel;
Menu.ItemCheckbox = MenuItemCheckbox;
Menu.ItemRadio = MenuItemRadio;
Menu.ButtonArrow = MenuButtonArrow;
