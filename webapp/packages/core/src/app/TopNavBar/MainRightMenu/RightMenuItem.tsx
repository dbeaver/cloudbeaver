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
import styled from 'reshadow';

import { IconOrImage } from '@dbeaver/core/blocks';
import { IMenuItem, MenuTrigger } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles, Style } from '@dbeaver/core/theming';

import { rightMenuStyles } from './rightMenuStyles';

type Props = Omit<ButtonHTMLAttributes<any>, 'style'> & {
  menuItem: IMenuItem;
  style?: Style[];
};

export const RightMenuItem = observer(function RightMenuItem({ menuItem, style = [], ...props }: Props) {
  const translate = useTranslate();

  if (!menuItem.panel) {
    if (menuItem.isHidden) {
      return null;
    }

    return styled(useStyles(rightMenuStyles))(
      <Button
        as="button" {...props}
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick && menuItem.onClick()}>
        {menuItem.icon && (
          <menu-trigger-icon as="div">
            <IconOrImage icon={menuItem.icon} />
          </menu-trigger-icon>
        )}
        {menuItem.title && <menu-trigger-title as='div'>{translate(menuItem.title)}</menu-trigger-title>}
      </Button>
    );
  }

  return styled(useStyles(...style, rightMenuStyles))(
    <MenuTrigger
      {...props}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      hidden={menuItem.isHidden}
      style={[...style, rightMenuStyles]}
    >
      {menuItem.icon && (
        <menu-trigger-icon as="div">
          <IconOrImage icon={menuItem.icon} />
        </menu-trigger-icon>
      )}
      {menuItem.title && <menu-trigger-title as='div'>{translate(menuItem.title)}</menu-trigger-title>}
    </MenuTrigger>
  );
});
