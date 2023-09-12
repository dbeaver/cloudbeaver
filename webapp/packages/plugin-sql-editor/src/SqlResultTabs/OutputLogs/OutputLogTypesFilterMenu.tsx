import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Icon, s, useS } from '@cloudbeaver/core-blocks';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { OUTPUT_LOGS_FILTER_MENU } from './OUTPUT_LOGS_FILTER_MENU';
import { OUTPUT_LOGS_PANEL_STATE } from './OUTPUT_LOGS_PANEL_STATE';
import style from './OutputLogTypesFilterMenu.m.css';
import type { SqlOutputLogsPanelState } from './useOutputLogsPanelState';

interface Props {
  state: SqlOutputLogsPanelState;
}

export const OutputLogsFilterMenu = observer<Props>(function OutputLogTypesFilterMenu({ state }) {
  const styles = useS(style);
  const menu = useMenu({
    menu: OUTPUT_LOGS_FILTER_MENU,
  });
  menu.context.set(OUTPUT_LOGS_PANEL_STATE, state);

  return styled(styles)(
    <ContextMenu className={s(styles, { contextMenu: true })} menu={menu} placement="bottom-end" modal>
      <Icon className={s(styles, { icon: true })} name="filter" viewBox="0 0 16 16" />
    </ContextMenu>,
  );
});
