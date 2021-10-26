/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { HotKeys } from 'react-hotkeys';
import styled, { css } from 'reshadow';

import { getComputed, useFocus } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ActionService } from '../Action/ActionService';
import type { IActionItem } from '../Action/IActionItem';
import { CaptureViewContext } from './CaptureViewContext';
import type { IView } from './IView';
import { useActiveView } from './useActiveView';
import { useViewContext } from './useViewContext';

const styles = css`
  div {
    outline: none;
  }
`;

interface Props {
  view: IView<any>;
  className?: string;
}

export const CaptureView = observer<Props>(function CaptureView({
  view,
  children,
  className,
}) {
  const [viewContext] = useViewContext(view);
  const actionService = useService(ActionService);
  const [onFocus, onBlur] = useActiveView(view);
  const [ref] = useFocus<HTMLDivElement>({ onFocus, onBlur });

  const context = useMemo(() => ({
    viewContext,
  }), [viewContext]);

  const actionItems = getComputed(() => (
    view.actions
      .map(action => actionService.getAction(viewContext, action))
      .filter(Boolean) as IActionItem[]
  ));

  const keyMap = actionItems.reduce((map, item) => ({
    ...map,
    [item.binding!.id]: item.binding?.binding.keys,
  }), {});

  const handlers = actionItems.reduce((map, item) => ({
    ...map,
    [item.binding!.id]: item.activate.bind(item.handler, true),
  }), {});

  return styled(styles)(
    <CaptureViewContext.Provider value={context}>
      <HotKeys
        keyMap={keyMap}
        handlers={handlers}
        innerRef={ref}
        className={className}
        tabIndex={0}
        allowChanges
      >
        {children}
      </HotKeys>
    </CaptureViewContext.Provider>
  );
});
