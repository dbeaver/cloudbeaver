/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { ButtonHTMLAttributes } from 'react';

import {
  IconOrImage,
  MenuPanelItemAndTriggerStyles,
  MenuTrigger,
  s,
  SContext,
  StyleRegistry,
  ToolsAction,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { IMenuItem } from '@cloudbeaver/core-dialogs';

import styles from './TableFooterMenuItem.m.css';

type Props = ButtonHTMLAttributes<any> & {
  menuItem: IMenuItem;
};

const registry: StyleRegistry = [
  [
    MenuPanelItemAndTriggerStyles,
    {
      mode: 'append',
      styles: [styles],
    },
  ],
];

export const TableFooterMenuItem = observer<Props>(function TableFooterMenuItem({ menuItem, ...props }) {
  const translate = useTranslate();
  const style = useS(styles);

  if (!menuItem.panel) {
    return (
      <SContext registry={registry}>
        <ToolsAction
          {...props}
          className={s(style, { toolsAction: true, hidden: menuItem.isHidden })}
          title={translate(menuItem.tooltip)}
          icon={menuItem.icon}
          viewBox="0 0 32 32"
          disabled={menuItem.isDisabled}
          onClick={() => menuItem.onClick?.()}
        >
          {translate(menuItem.title)}
        </ToolsAction>
      </SContext>
    );
  }

  return (
    <SContext registry={registry}>
      <MenuTrigger
        {...props}
        className={s(style, { menuTrigger: true, hidden: menuItem.isHidden })}
        title={translate(menuItem.tooltip)}
        panel={menuItem.panel}
        disabled={menuItem.isDisabled}
        modal
      >
        {menuItem.icon && (
          <div className={s(style, { menuTriggerIcon: true })}>
            <IconOrImage className={s(style, { iconOrImage: true })} icon={menuItem.icon} viewBox="0 0 32 32" />
          </div>
        )}
        {menuItem.title && <div className={s(style, { menuTriggerTitle: true })}>{translate(menuItem.title)}</div>}
      </MenuTrigger>
    </SContext>
  );
});
