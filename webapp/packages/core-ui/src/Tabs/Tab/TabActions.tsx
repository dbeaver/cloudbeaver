import { observer } from 'mobx-react-lite';

import { Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab.m.css';
import TabActionsStyle from './TabActions.m.css';
import { TabMenu, TabMenuProps } from './TabMenu';

interface Props extends TabMenuProps {
  handleClose: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  canClose: boolean;
}

export const TabActions = observer<Props>(function TabActions({ handleClose, state, canClose, tabId, menuContext }) {
  const translate = useTranslate();
  const styles = useS(TabStyles, TabActionsStyle);

  return (
    <div className={s(styles, { tabActions: true })}>
      {canClose && (
        <div className={s(styles, { tabAction: true })} title={translate('ui_close')} onClick={handleClose}>
          <Icon className={s(styles, { tabIcon: true })} name="cross-bold" viewBox="0 0 7 8" />
        </div>
      )}
      <TabMenu tabId={tabId} state={state} menuContext={menuContext} />
    </div>
  );
});
