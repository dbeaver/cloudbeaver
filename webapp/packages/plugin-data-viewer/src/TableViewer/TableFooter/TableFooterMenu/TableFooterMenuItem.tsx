/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';
import styled, { css, use } from 'reshadow';

import { IconOrImage, ToolsAction } from '@cloudbeaver/core-blocks';
import { IMenuItem, MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

type Props = ButtonHTMLAttributes<any> & {
  menuItem: IMenuItem;
};

export const tableFooterMenuStyles = css`
    Menu {
      composes: theme-text-on-surface from global;
    }
    MenuTrigger {
      composes: theme-ripple from global;
      height: 100%;
      padding: 0 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      &[|hidden] {
        display: none;
      }
    }
    ToolsAction[|hidden] {
      display: none;
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
  `;

export const TableFooterMenuItem = observer<Props>(function TableFooterMenuItem({
  menuItem,
  ...props
}) {
  const translate = useTranslate();
  const styles = useStyles(tableFooterMenuStyles);

  if (!menuItem.panel) {
    return styled(styles)(
      <ToolsAction
        {...props}
        {...use({ hidden: menuItem.isHidden })}
        title={translate(menuItem.tooltip)}
        icon={menuItem.icon}
        viewBox="0 0 32 32"
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick?.()}
      >
        {translate(menuItem.title)}
      </ToolsAction>
    );
  }

  return styled(styles)(
    <MenuTrigger
      {...props}
      {...use({ hidden: menuItem.isHidden })}
      title={translate(menuItem.tooltip)}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      style={[tableFooterMenuStyles]}
      modal
    >
      {menuItem.icon && (
        <menu-trigger-icon>
          <IconOrImage icon={menuItem.icon} viewBox="0 0 32 32" />
        </menu-trigger-icon>
      )}
      {menuItem.title && <menu-trigger-title>{translate(menuItem.title)}</menu-trigger-title>}
    </MenuTrigger>
  );
});
