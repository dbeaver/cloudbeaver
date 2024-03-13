import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { getComputed, Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../../ContextMenu/ContextMenu';
import type { ITabsContext } from '../TabsContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import TabStyles from './Tab.m.css';
import TabActionsStyle from './TabActions.m.css';

interface Props {
  state: ITabsContext<any>;
  handleClose: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  tabId: string;
  canClose: boolean;
  menuContext?: IDataContext;
  className?: string;
}

export const TabActions = observer<Props>(function TabActions({ handleClose, state, canClose, tabId, menuContext, className }) {
  const translate = useTranslate();
  const styles = useS(TabActionsStyle, TabStyles);

  const [menuOpened, switchState] = useState(false);
  const menu = useMenu({
    menu: MENU_TAB,
    context: menuContext,
  });

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, state);
  menu.context.set(DATA_CONTEXT_TAB_ID, tabId);

  const hidden = getComputed(() => !menu.items.length || menu.items.every(item => item.hidden));

  if (hidden) {
    return null;
  }

  return (
    <div className={s(styles, { tabActions: true }, className)}>
      {canClose && (
        <div className={s(styles, { tabAction: true })} title={translate('ui_close')} onClick={handleClose}>
          <Icon className={s(styles, { icon: true })} name="cross-bold" viewBox="0 0 7 8" />
        </div>
      )}
      <div className={s(styles, { portal: true, portalMenuOpened: menuOpened })}>
        <ContextMenu menu={menu} placement="bottom-start" modal disclosure onVisibleSwitch={switchState}>
          <div className={s(styles, { tabAction: true })}>
            <Icon className={s(styles, { icon: true })} name="dots" viewBox="0 0 32 32" />
          </div>
        </ContextMenu>
      </div>
    </div>
  );
});
