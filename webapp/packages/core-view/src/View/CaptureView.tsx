/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { s, useFocus, useHotkeys, useMergeRefs, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
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
  const [ref] = useFocus<HTMLDivElement>({ onFocus: activeView.focusView, onBlur: activeView.blurView });
  const style = useS(styles);

  const allActionItems = view.actions.map(action => actionService.getAction(viewContext, action)).filter(Boolean) as IActionItem[];
  const enabledActionItems = allActionItems.filter(action => action?.binding && !action.isDisabled()).filter(Boolean) as IActionItem[];

  const allKeys = allActionItems.map(item => getCommonAndOSSpecificKeys(item.binding?.binding)).flat();

  const divRef = useHotkeys(
    allKeys,
    (event, handler) => {
      /**
       * isTrusted - to prevent double handling of the event
       * EventContext.has - to prevent handling the event if it was already handled by a child view
       */
      if (!event.isTrusted || EventContext.has(event, EventStopPropagationFlag)) {
        return;
      }

      const action = enabledActionItems.find(action => {
        const commonAndSpecificKeys = getCommonAndOSSpecificKeys(action.binding?.binding);
        return commonAndSpecificKeys.some(key => {
          const hotkey = parseHotkey(key);

          return isObjectsEqual(hotkey, handler);
        });
      });

      EventContext.set(event, EventStopPropagationFlag);
      action?.activate(true);
    },
    {
      enabled: allKeys.length > 0,
      useKey: true,
      enableOnFormTags: ['INPUT', 'SELECT', 'TEXTAREA', 'textbox'],
      preventDefault(event, handler) {
        // Don't prevent default if event was already handled by a child view
        if (EventContext.has(event, EventStopPropagationFlag)) {
          return false;
        }

        const action = enabledActionItems.find(action => {
          const commonAndSpecificKeys = getCommonAndOSSpecificKeys(action.binding?.binding);
          return commonAndSpecificKeys.some(key => {
            const hotkey = parseHotkey(key);

            return isObjectsEqual(hotkey, handler);
          });
        });

        return action?.binding?.binding.preventDefault === true;
      },
      enableOnContentEditable: true,
    },
  );

  const mergedRef = useMergeRefs(ref, divRef);

  return (
    <CaptureViewContext.Provider value={viewContext}>
      <div ref={mergedRef} className={s(style, { container: true }, className)} tabIndex={0}>
        {children}
      </div>
    </CaptureViewContext.Provider>
  );
});
