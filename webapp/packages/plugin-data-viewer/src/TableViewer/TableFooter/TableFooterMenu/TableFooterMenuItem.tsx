/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { ButtonHTMLAttributes } from 'react';
import { Button } from 'reakit';
import styled, { css } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { IMenuItem, MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

type Props = ButtonHTMLAttributes<any> & {
  menuItem: IMenuItem;
};

export const tableFooterMenuStyles = composes(
  css`
    Menu {
      composes: theme-text-on-surface from global;
    }
    Button {
      composes: theme-text-on-secondary from global;
    }
    MenuTrigger, Button {
      composes: theme-ripple from global;
    }
  `,
  css`
    MenuTrigger, Button {
      height: 100%;
      padding: 0 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    Button {
      background: transparent;
      outline: none;
    }
    menu-trigger-icon IconOrImage {
      display: block;
      width: 24px;
    }
    menu-trigger-title {
      display: block;
    }
    menu-trigger-icon + menu-trigger-title {
      padding-left: 8px;
    }
  `
);

export const TableFooterMenuItem = observer(function TableFooterMenuItem({
  menuItem,
  ...props
}: Props) {
  const translate = useTranslate();

  if (!menuItem.panel) {
    return styled(useStyles(tableFooterMenuStyles))(
      <Button
        as="button" {...props}
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick && menuItem.onClick()}>
        {menuItem.icon && (
          <menu-trigger-icon as="div">
            <IconOrImage icon={menuItem.icon} viewBox="0 0 32 32" />
          </menu-trigger-icon>
        )}
        {menuItem.title && <menu-trigger-title as="div">{translate(menuItem.title)}</menu-trigger-title>}
      </Button>
    );
  }

  return styled(useStyles(tableFooterMenuStyles))(
    <MenuTrigger
      {...props}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      style={[tableFooterMenuStyles]}
    >
      {menuItem.icon && (
        <menu-trigger-icon as="div">
          <IconOrImage icon={menuItem.icon} viewBox="0 0 32 32" />
        </menu-trigger-icon>
      )}
      {menuItem.title && <menu-trigger-title as="div">{translate(menuItem.title)}</menu-trigger-title>}
    </MenuTrigger>
  );
});
