/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { s, useFocus, useHotkeys, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

import { ActionService } from '../Action/ActionService.js';
import type { IActionItem } from '../Action/IActionItem.js';
import { getCommonAndOSSpecificKeys } from '../Action/KeyBinding/getCommonAndOSSpecificKeys.js';
import styles from './CaptureView.module.css';
import { CaptureViewContext } from './CaptureViewContext.js';
import type { IView } from './IView.js';
import { parseHotkey } from './parseHotkey.js';
import { useActiveView } from './useActiveView.js';
import { useViewContext } from './useViewContext.js';

export interface ICaptureViewProps {
  view: IView<any>;
  className?: string;
}

export const CaptureView = observer<React.PropsWithChildren<ICaptureViewProps>>(function CaptureView({ view, children, className }) {
  const parentContext = useContext(CaptureViewContext);
  const viewContext = useViewContext(view, parentContext);
  const actionService = useService(ActionService);
  const activeView = useActiveView(view);
  const [ref, state] = useFocus<HTMLDivElement>({ onFocus: activeView.focusView, onBlur: activeView.blurView });
  const style = useS(styles);

  const actionItems = view.actions
    .map(action => actionService.getAction(viewContext, action))
    .filter(action => action?.binding && !action.isDisabled())
    .filter(Boolean) as IActionItem[];

  const keys = actionItems.map(item => getCommonAndOSSpecificKeys(item.binding?.binding)).flat();

  useHotkeys(
    keys,
    (event, handler) => {
      if (!state.reference?.contains(document.activeElement)) {
        return;
      }

      const action = actionItems.find(action => {
        const commonAndSpecificKeys = getCommonAndOSSpecificKeys(action.binding?.binding);
        return commonAndSpecificKeys.some(key => {
          const hotkey = parseHotkey(key);

          return isObjectsEqual(hotkey, handler);
        });
      });

      action?.activate(true);
    },
    {
      enabled: keys.length > 0,
      enableOnFormTags: ['INPUT', 'SELECT', 'TEXTAREA'],
      preventDefault(event, handler) {
        const action = actionItems.find(action => {
          const commonAndSpecificKeys = getCommonAndOSSpecificKeys(action.binding?.binding);
          return commonAndSpecificKeys.some(key => {
            const hotkey = parseHotkey(key);

            return isObjectsEqual(hotkey, handler);
          });
        });
        const isAppliedInSelectedScope = Boolean(state.reference?.contains(document.activeElement));

        return isAppliedInSelectedScope && action?.binding?.binding.preventDefault === true;
      },
      enableOnContentEditable: true,
    },
  );

  return (
    <CaptureViewContext.Provider value={viewContext}>
      <div ref={ref} className={s(style, { container: true }, className)} tabIndex={0}>
        {children}
      </div>
    </CaptureViewContext.Provider>
  );
});
