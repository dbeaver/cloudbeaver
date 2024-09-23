/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';

import type { ITabsContext } from '../TabsContext.js';
import TabStyle from './Tab.module.css';
import style from './TabActions.module.css';
import { TabMenu } from './TabMenu.js';

interface TabActionsProps {
  tabId: string;
  canClose: boolean;
  state: ITabsContext<any>;
  className?: string;
  menuContext?: IDataContext;
  handleClose: React.MouseEventHandler<HTMLDivElement> | undefined;
}

export const TabActions = observer(function TabActions({ tabId, canClose, state, className, menuContext, handleClose }: TabActionsProps) {
  const styles = useS(TabStyle, style);

  return (
    <div className={s(styles, { tabActions: true }, className)}>
      {canClose && <TabAction iconName="cross-bold" title="ui_close" onClick={handleClose} />}
      <TabMenu tabId={tabId} state={state} menuContext={menuContext}>
        {/* TODO use TabAction but resolve ContextMenu issue first */}
        <div className={s(styles, { tabAction: true })}>
          <Icon className={s(styles, { icon: true })} name="dots" viewBox="0 0 32 32" />
        </div>
      </TabMenu>
    </div>
  );
});

interface TabActionProps {
  iconName: string;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const TabAction = observer(function TabAction({ iconName, title, onClick }: TabActionProps) {
  const styles = useS(TabStyle, style);
  const translate = useTranslate();

  return (
    <div className={s(styles, { tabAction: true })} title={translate(title)} onClick={onClick}>
      <Icon className={s(styles, { icon: true })} name={iconName} viewBox="0 0 7 8" />
    </div>
  );
});
