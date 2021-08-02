/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useRef, useEffect, useState } from 'react';

import { useObjectRef } from './useObjectRef';

interface IOptions {
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

interface IState {
  mouseEnter: boolean;
}

export interface IMouseHook<T> {
  state: IState;
  reference: React.RefObject<T>;
}

export function useMouse<T extends HTMLElement>(options: IOptions): IMouseHook<T> {
  const handlersRef = useObjectRef(options);
  const reference = useRef<T>(null);
  const state = useObjectRef({ mouseEnter: false }, null, { mouseEnter: observable.ref });

  useEffect(() => { // performance heavy
    if (!reference.current) {
      state.mouseEnter = false;
      return;
    }

    const mouseOverHandler = (event: MouseEvent) => {
      if (handlersRef.onMouseEnter) {
        handlersRef.onMouseEnter(event);
      }

      if (!state.mouseEnter) {
        state.mouseEnter = true;
      }
    };

    const mouseOutHandler = (event: MouseEvent) => {
      if (handlersRef.onMouseLeave) {
        handlersRef.onMouseLeave(event);
      }

      if (state.mouseEnter) {
        state.mouseEnter = false;
      }
    };

    const element = reference.current;

    element.addEventListener('mouseenter', mouseOverHandler);
    element.addEventListener('mouseleave', mouseOutHandler);

    return () => {
      element.removeEventListener('mouseenter', mouseOverHandler);
      element.removeEventListener('mouseleave', mouseOutHandler);
    };
  }, []);

  return { state, reference };
}
