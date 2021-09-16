/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useRef, useEffect, useLayoutEffect } from 'react';

import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';

interface FocusOptions {
  focusFirstChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface IState {
  focus: boolean;
  focusFirstChild: () => void;
}

export function useFocus<T extends HTMLElement>({
  focusFirstChild,
  onFocus,
  onBlur,
}: FocusOptions): [React.RefObject<T>, IState] {
  const handlersRef = useObjectRef({ onFocus, onBlur });
  const reference = useRef<T>(null);
  // TODO: seems can be inconsistent when element changes
  const state = useObservableRef<IState>(
    () => ({
      focus: false,
      focusFirstChild() {
        if (reference.current !== null && focusFirstChild) {
          const firstFocusable = reference.current
            .querySelectorAll<T>(`
            button:not([disabled=disabled]), 
            [href], 
            input:not([disabled=disabled],[readonly=readonly]), 
            select:not([disabled=disabled],[readonly=readonly]), 
            textarea:not([disabled=disabled],[readonly=readonly]), 
            [tabndex]:not([tabndex="-1"])`);

          let tabIndex = -1;
          let lastElement: T | undefined;

          firstFocusable.forEach(element => {
            if (element.tabIndex > tabIndex) {
              lastElement = element;
              tabIndex = element.tabIndex;
            }
          });

          if (lastElement) {
            lastElement.focus();
          }
        }
      },
    }),
    { focus: observable.ref },
    false,
    'useFocus'
  );

  useLayoutEffect(() => {
    state.focusFirstChild();
  }, [focusFirstChild]);

  useEffect(() => {
    if (!reference.current) {
      return;
    }

    const focusHandler = () => {
      if (handlersRef.onFocus) {
        handlersRef.onFocus();
      }

      state.focus = true;
    };

    const blurHandler = () => {
      if (handlersRef.onBlur) {
        handlersRef.onBlur();
      }

      state.focus = false;
    };

    const element = reference.current;

    element.addEventListener('focusin', focusHandler);
    element.addEventListener('focusout', blurHandler);

    return () => {
      element.removeEventListener('focusin', focusHandler);
      element.removeEventListener('focusout', blurHandler);
    };
  });

  return [reference, state];
}
