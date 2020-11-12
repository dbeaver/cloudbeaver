/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { ButtonHTMLAttributes } from 'react';
import styled from 'reshadow';

import { Icon, IconOrImage } from '@cloudbeaver/core-blocks';
import { IMenuItem, MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, Style } from '@cloudbeaver/core-theming';

import { TopMenuButton } from './TopMenuButton';
import { topMenuStyles } from './topMenuStyles';

type TopMenuItemProps = Omit<ButtonHTMLAttributes<any>, 'style'> & {
  menuItem: IMenuItem;
  style?: Style[];
};

export const TopMenuItem = observer(function TopMenuItem({ menuItem, style = [], ...props }: TopMenuItemProps) {
  const translate = useTranslate();
  const styles = useStyles(!menuItem.panel ? [] : [...style, topMenuStyles]);

  if (!menuItem.panel) {
    return (
      <TopMenuButton
        {...props}
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick?.()}
      >
        {translate(menuItem.title)}
      </TopMenuButton>
    );
  }

  return styled(styles)(
    <MenuTrigger
      {...props}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      style={[...style, topMenuStyles]}
      placement="bottom-end"
      onClick={() => menuItem.onClick?.()}
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
