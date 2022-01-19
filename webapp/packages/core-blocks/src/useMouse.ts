/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useEffect, useState } from 'react';

import { throttle } from '@cloudbeaver/core-utils';

import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';

interface IOptions {
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

interface IState {
  mouseEnter: boolean;
}

export interface IMouseHook<T> {
  state: IState;
  ref: T | null;
  reference: (obj: T) => void;
}

export function useMouse<T extends HTMLElement>(options: IOptions = {}): IMouseHook<T> {
  const handlersRef = useObjectRef(options);
  const [reference, setReference] = useState<T | null>(null);
  const state = useObservableRef(() => ({
    mouseEnter: false,
  }), {
    mouseEnter: observable.ref,
  }, false, 'useMouse');

  useEffect(() => { // performance heavy
    state.mouseEnter = false;

    if (!reference) {
      return;
    }

    const mouseOverHandler = throttle((event: MouseEvent) => {
      if (handlersRef.onMouseEnter) {
        handlersRef.onMouseEnter(event);
      }

      if (!state.mouseEnter) {
        state.mouseEnter = true;
      }
    }, 33);

    const mouseOutHandler = throttle((event: MouseEvent) => {
      if (handlersRef.onMouseLeave) {
        handlersRef.onMouseLeave(event);
      }

      if (state.mouseEnter) {
        state.mouseEnter = false;
      }
    }, 40);

    reference.addEventListener('mouseenter', mouseOverHandler);
    reference.addEventListener('mouseleave', mouseOutHandler);

    return () => {
      reference.removeEventListener('mouseenter', mouseOverHandler);
      reference.removeEventListener('mouseleave', mouseOutHandler);
    };
  }, [reference]);

  return { ref: reference, state, reference: setReference };
}
