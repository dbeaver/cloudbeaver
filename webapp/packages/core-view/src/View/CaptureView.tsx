/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useHotkeys } from 'react-hotkeys-hook';
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
  const viewContext = useViewContext(view);
  const actionService = useService(ActionService);
  const [onFocus, onBlur] = useActiveView(view);
  const [ref] = useFocus<HTMLDivElement>({ onFocus, onBlur });

  const actionItems = getComputed(() => (
    view.actions
      .map(action => actionService.getAction(viewContext, action))
      .filter(action => action?.binding && !action.isDisabled())
      .filter(Boolean) as IActionItem[]
  ));

  const keys = actionItems
    .map(item => item.binding?.binding.keys)
    .flat()
    .join(',');

  useHotkeys(keys, (event, handler) => {
    if (!ref.current?.contains(document.activeElement)) {
      return;
    }

    const action = actionItems.find(action => (
      action.binding?.binding.keys === handler.key
      || action.binding?.binding.keys.includes(handler.key)
    ));

    if (action?.binding?.binding.preventDefault) {
      event.preventDefault();
    }

    action?.activate(true);
  }, {
    enableOnTags: ['INPUT', 'SELECT', 'TEXTAREA'],
  });

  return styled(styles)(
    <CaptureViewContext.Provider value={viewContext}>
      <div ref={ref} className={className} tabIndex={0}>
        {children}
      </div>
    </CaptureViewContext.Provider>
  );
});
