/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';
import styled from 'reshadow';

import { IMenuItem, MenuTrigger } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, ComponentStyle, joinStyles } from '@cloudbeaver/core-theming';

import { topMenuStyles } from './topMenuStyles';
import { TopNavButton } from './TopNavButton';

interface IProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  menuItem: IMenuItem;
  style?: ComponentStyle;
}

export const TopMenuItem = observer<IProps>(function TopMenuItem({ menuItem, style, ...props }) {
  const translate = useTranslate();
  const styles = useStyles(style, topMenuStyles);

  const title = translate(menuItem.title);

  if (!menuItem.panel) {
    return (
      <TopNavButton
        {...props}
        title={title}
        disabled={menuItem.isDisabled}
        onClick={() => menuItem.onClick?.()}
      />
    );
  }

  return styled(styles)(
    <MenuTrigger
      {...props}
      panel={menuItem.panel}
      disabled={menuItem.isDisabled}
      style={joinStyles(style, topMenuStyles)}
      placement="bottom-end"
      modal
      disclosure
      onClick={() => menuItem.onClick?.()}
    >
      <TopNavButton
        title={title}
        icon={menuItem.icon}
        style={style}
        menu
      />
    </MenuTrigger>
  );
});
