/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, s, useS, type IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';

import type { ITabsContext } from '../TabsContext.js';
import TabStyle from './Tab.module.css';
import style from './TabActions.module.css';
import { TabMenu } from './TabMenu.js';
import { TabAction } from './TabAction.js';

interface TabActionsProps {
  tabId: string;
  canClose: boolean;
  state: ITabsContext<any>;
  className?: string;
  menuContext?: IDataContext;
  contextMenuPosition?: IContextMenuPosition;
  handleClose: React.MouseEventHandler<HTMLButtonElement> | undefined;
}

export const TabActions = observer(function TabActions({
  tabId,
  canClose,
  state,
  className,
  menuContext,
  contextMenuPosition,
  handleClose,
}: TabActionsProps) {
  const styles = useS(TabStyle, style);

  return (
    <div className={s(styles, { tabActions: true }, className)}>
      {canClose && <TabAction iconName="cross-bold" title="ui_close" onClick={handleClose} />}
      <TabMenu tabId={tabId} state={state} menuContext={menuContext} contextMenuPosition={contextMenuPosition}>
        {/* TODO use TabAction but resolve ContextMenu issue first */}
        <div className={s(styles, { tabAction: true })}>
          <Icon className={s(styles, { icon: true })} name="dots" viewBox="0 0 32 32" />
        </div>
      </TabMenu>
    </div>
  );
});
