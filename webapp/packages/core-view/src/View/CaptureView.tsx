/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useRef } from 'react';

import { s, useFocus, useHotkey, useMergeRefs, useS, type RegisterableHotkey } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { ActionService } from '../Action/ActionService.js';
import type { IActionItem } from '../Action/IActionItem.js';
import { getCommonAndOSSpecificKeys } from '../Action/KeyBinding/getCommonAndOSSpecificKeys.js';
import styles from './CaptureView.module.css';
import { CaptureViewContext } from './CaptureViewContext.js';
import type { IView } from './IView.js';
import { useActiveView } from './useActiveView.js';
import { useViewContext } from './useViewContext.js';

export interface ICaptureViewProps {
  view: IView<any>;
  className?: string;
}

interface ICaptureViewHotkeyProps {
  hotkey: RegisterableHotkey;
  target: React.RefObject<HTMLDivElement | null>;
  action: IActionItem | undefined;
}

function CaptureViewHotkey({ hotkey, target, action }: ICaptureViewHotkeyProps) {
  useHotkey(
    hotkey,
    event => {
      /**
       * isTrusted - to prevent double handling of the event
       * EventContext.has - to prevent handling the event if it was already handled by a child view
       */
      if (!event.isTrusted || EventContext.has(event, EventStopPropagationFlag) || !action) {
        return;
      }

      if (action.binding?.binding.preventDefault) {
        event.preventDefault();
      }

      EventContext.set(event, EventStopPropagationFlag);
      action.activate(true);
    },
    {
      target,
      ignoreInputs: false,
    },
  );

  return null;
}

export const CaptureView = observer<React.PropsWithChildren<ICaptureViewProps>>(function CaptureView({ view, children, className }) {
  const parentContext = useContext(CaptureViewContext);
  const viewContext = useViewContext(view, parentContext);
  const actionService = useService(ActionService);
  const activeView = useActiveView(view);
  const [focusRef] = useFocus<HTMLDivElement>({ onFocus: activeView.focusView, onBlur: activeView.blurView });
  const divRef = useRef<HTMLDivElement>(null);
  const style = useS(styles);

  const allActionItems = view.actions.map(action => actionService.getAction(viewContext, action)).filter(Boolean) as IActionItem[];
  const enabledActionItems = allActionItems.filter(action => action?.binding && !action.isDisabled()).filter(Boolean) as IActionItem[];
  const allKeys = allActionItems.map(item => getCommonAndOSSpecificKeys(item.binding?.binding)).flat();

  const mergedRef = useMergeRefs(focusRef, divRef);

  return (
    <CaptureViewContext.Provider value={viewContext}>
      {allKeys.map(key => (
        <CaptureViewHotkey
          key={key}
          hotkey={key as RegisterableHotkey}
          target={divRef}
          action={enabledActionItems.find(action => getCommonAndOSSpecificKeys(action.binding?.binding).includes(key))}
        />
      ))}
      <div ref={mergedRef} className={s(style, { container: true }, className)} tabIndex={0}>
        {children}
      </div>
    </CaptureViewContext.Provider>
  );
});
