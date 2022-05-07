/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { useEffect } from 'react';

import { useObjectRef } from './useObjectRef';
import { useObservableRef } from './useObservableRef';

interface FocusOptions {
  autofocus?: boolean;
  focusFirstChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface IState<T extends HTMLElement> {
  focus: boolean;
  reference: T | null;
  setRef: (ref: T | null) => void;
  updateFocus: () => void;
  focusFirstChild: () => void;
}

export function useFocus<T extends HTMLElement>({
  autofocus,
  focusFirstChild,
  onFocus,
  onBlur,
}: FocusOptions): [(obj: T | null) => void, IState<T>] {
  const optionsRef = useObjectRef({ autofocus, focusFirstChild, onFocus, onBlur });
  const state = useObservableRef<IState<T>>(
    () => ({
      reference: null,
      focus: false,
      setRef(ref: T | null) {
        if (this.reference !== ref) {
          this.reference = ref;

          this.updateFocus();
        }
      },
      updateFocus() {
        if (this.reference) {
          if (optionsRef.autofocus) {
            this.reference.focus();
          }

          this.focusFirstChild();
        }
      },
      focusFirstChild() {
        if (this.reference !== null && optionsRef.focusFirstChild) {
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
      setRef: action.bound,
      updateFocus: action.bound,
    },
    false,
    undefined,
    'useFocus'
  );

  useEffect(() => {
    const reference = state.reference;

    if (!reference) {
      return;
    }

    const focusHandler = () => {
      if (optionsRef.onFocus) {
        optionsRef.onFocus();
      }

      state.focus = true;
    };

    const blurHandler = () => {
      if (optionsRef.onBlur) {
        optionsRef.onBlur();
      }

      state.focus = false;
    };

    reference.addEventListener('focusin', focusHandler);
    reference.addEventListener('focusout', blurHandler);

    return () => {
      reference.removeEventListener('focusin', focusHandler);
      reference.removeEventListener('focusout', blurHandler);
    };
  }, [state.reference]);

  return [state.setRef, state];
}
