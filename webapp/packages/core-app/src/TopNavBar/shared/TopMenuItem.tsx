/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { ButtonHTMLAttributes } from 'react';
import { Button } from 'reakit/Button';
import styled, { css } from 'reshadow';

import { Icon, IconOrImage } from '@cloudbeaver/core-blocks';
import { IMenuItem, MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles, Style } from '@cloudbeaver/core-theming';

import { topMenuStyles } from './topMenuStyles';

type TopMenuItemProps = Omit<ButtonHTMLAttributes<any>, 'style'> & {
  menuItem: IMenuItem;
  style?: Style[];
};

const buttonStyle = composes(
  css`
    Button {
      composes: theme-ripple from global;
    }  
  `,
  css`
    Button {
      height: 100%;
      padding: 0 16px !important;
      text-transform: uppercase;
      font-weight: 700;
      
      background: none;
      border: none;
      outline: none !important;
      color: inherit;
      cursor: pointer;
 
      & div {
        display: flex;
        align-items: center;
      }
    }
  `
);

export const TopMenuItem = observer(function TopMenuItem({ menuItem, style = [], ...props }: TopMenuItemProps) {
  const translate = useTranslate();

  if (!menuItem.panel) {
    return styled(useStyles(buttonStyle))(
      <Button
        as="button" {...props}
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick && menuItem.onClick()}>
        <div>{translate(menuItem.title)}</div>
      </Button>
    );
  }

  return styled(useStyles(...style, topMenuStyles))(
    <MenuTrigger
      {...props}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      style={[...style, topMenuStyles]}
      placement={'bottom-end'}
    >
      {menuItem.icon && (
        <menu-trigger-icon as="div">
          <IconOrImage icon={menuItem.icon} />
        </menu-trigger-icon>
      )}
      <div>{translate(menuItem.title)}</div>
      <Icon name="angle" viewBox="0 0 15 8" />
    </MenuTrigger>
  );
});
