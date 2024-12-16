/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, MenuItemElementStyles, s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_ACTIONS,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
  DATA_CONTEXT_DV_RESULT_KEY,
  DATA_CONTEXT_DV_SIMPLE,
  type IDatabaseDataModel,
  type IDataPresentationActions,
  type IDataTableActions,
  type IResultSetElementKey,
  MENU_DV_CONTEXT_MENU,
} from '@cloudbeaver/plugin-data-viewer';

import classes from './CellMenu.module.css';

interface Props {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  spreadsheetActions: IDataPresentationActions<IResultSetElementKey>;
  resultIndex: number;
  cellKey: IResultSetElementKey;
  simple: boolean;
  onStateSwitch?: (state: boolean) => void;
}

const registry: StyleRegistry = [
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [classes],
    },
  ],
];

export const CellMenu = observer<Props>(function CellMenu({ model, actions, spreadsheetActions, resultIndex, cellKey, simple, onStateSwitch }) {
  const style = useS(classes);
  const menu = useMenu({ menu: MENU_DV_CONTEXT_MENU });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex, id);
    context.set(DATA_CONTEXT_DV_SIMPLE, simple, id);
    context.set(DATA_CONTEXT_DV_ACTIONS, actions, id);
    context.set(DATA_CONTEXT_DV_PRESENTATION_ACTIONS, spreadsheetActions, id);
    context.set(DATA_CONTEXT_DV_RESULT_KEY, cellKey, id);
  });

  function stopPropagation(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }

  function markStopPropagation(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  return (
    <SContext registry={registry}>
      <div className={s(style, { container: true })} onMouseUp={markStopPropagation} onDoubleClick={stopPropagation}>
        <ContextMenu
          className={s(style, { contextMenu: true })}
          menu={menu}
          placement="auto-end"
          tabIndex={-1}
          modal
          disclosure
          onVisibleSwitch={onStateSwitch}
        >
          <div role="button" className={s(style, { trigger: true })}>
            <Icon className={s(style, { icon: true })} name="snack" viewBox="0 0 16 10" />
          </div>
        </ContextMenu>
      </div>
    </SContext>
  );
});
