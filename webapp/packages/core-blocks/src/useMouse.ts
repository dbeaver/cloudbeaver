/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { useEffect, useState } from 'react';

import { throttle } from '@cloudbeaver/core-utils';

import { useObjectRef } from './useObjectRef.js';
import { useObservableRef } from './useObservableRef.js';

interface IPoint {
  x: number;
  y: number;
}

interface IOptions {
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  onMouseMove?: (event: MouseEvent) => void;
}

interface IState {
  position: IPoint | null;
  mouseEnter: boolean;
}

export interface IMouseHook<T> {
  state: IState;
  ref: T | null;
  reference: (obj: T | null) => void;
}

export function useMouse<T extends HTMLElement>(options: IOptions = {}): IMouseHook<T> {
  const handlersRef = useObjectRef(options);
  const [reference, setReference] = useState<T | null>(null);
  const state = useObservableRef<IState>(
    () => ({
      mouseEnter: false,
      position: null,
    }),
    {
      mouseEnter: observable.ref,
      position: observable,
    },
    false,
    'useMouse',
  );

  useEffect(() => {
    // performance heavy
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
        state.position = null;
      }
    }, 40);

    const mouseMoveHandler = throttle((event: MouseEvent) => {
      if (handlersRef.onMouseMove) {
        handlersRef.onMouseMove(event);
      }
      const rect = reference.getBoundingClientRect();

      state.position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }, 33);

    reference.addEventListener('mouseenter', mouseOverHandler);
    reference.addEventListener('mouseleave', mouseOutHandler);
    reference.addEventListener('mousemove', mouseMoveHandler);
    reference.addEventListener('dragover', mouseMoveHandler);

    return () => {
      reference.removeEventListener('mouseenter', mouseOverHandler);
      reference.removeEventListener('mouseleave', mouseOutHandler);
      reference.removeEventListener('mousemove', mouseMoveHandler);
      reference.removeEventListener('dragover', mouseMoveHandler);
    };
  }, [reference]);

  return { ref: reference, state, reference: setReference };
}
