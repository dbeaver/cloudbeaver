/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useEffect, useLayoutEffect, useState } from 'react';

import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';

interface FocusOptions {
  focusFirstChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface IState<T extends HTMLElement> {
  focus: boolean;
  reference: T | null;
  focusFirstChild: () => void;
}

export function useFocus<T extends HTMLElement>({
  focusFirstChild,
  onFocus,
  onBlur,
}: FocusOptions): [(obj: T | null) => void, IState<T>] {
  const handlersRef = useObjectRef({ onFocus, onBlur });
  const [reference, setRef] = useState<T | null>(null);
  const state = useObservableRef<IState<T>>(
    () => ({
      focus: false,
      focusFirstChild() {
        if (this.reference !== null && focusFirstChild) {
          const firstFocusable = this.reference
            .querySelectorAll<T>(`
            button:not([disabled=disabled]), 
            [href], 
            input:not([disabled=disabled]):not([readonly=readonly]), 
            select:not([disabled=disabled]):not([readonly=readonly]), 
            textarea:not([disabled=disabled]):not([readonly=readonly]), 
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
    { 
      focus: observable.ref,
      reference: observable.ref,
    },
    {
      reference,
    },
    undefined,
    'useFocus'
  );

  useLayoutEffect(() => {
    state.focusFirstChild();
  }, [focusFirstChild, reference]);

  useEffect(() => {
    if (!reference) {
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

    reference.addEventListener('focusin', focusHandler);
    reference.addEventListener('focusout', blurHandler);

    return () => {
      reference.removeEventListener('focusin', focusHandler);
      reference.removeEventListener('focusout', blurHandler);
    };
  }, [reference]);

  return [setRef, state];
}
