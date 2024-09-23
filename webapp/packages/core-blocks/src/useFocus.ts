/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { useLayoutEffect } from 'react';

import { useObjectRef } from './useObjectRef.js';
import { useObservableRef } from './useObservableRef.js';

interface FocusOptions {
  autofocus?: boolean;
  focusFirstChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface IState<T extends HTMLElement> {
  focus: boolean;
  reference: T | null;
  lastFocus: HTMLElement | null;
  setRef: (ref: T | null) => void;
  updateFocus: () => void;
  focusFirstChild: () => void;
  restoreFocus: () => void;
}

export function useFocus<T extends HTMLElement>({ autofocus, focusFirstChild, onFocus, onBlur }: FocusOptions): [(obj: T | null) => void, IState<T>] {
  const optionsRef = useObjectRef({ autofocus, focusFirstChild, onFocus, onBlur });
  const state = useObservableRef<IState<T>>(
    () => ({
      reference: null,
      focus: false,
      lastFocus: null,
      setRef(ref: T | null) {
        if (this.reference !== ref) {
          this.reference = ref;
        }
      },
      updateFocus() {
        if (this.reference) {
          if (
            document.activeElement instanceof HTMLElement &&
            document.activeElement !== this.reference &&
            (optionsRef.autofocus || optionsRef.focusFirstChild)
          ) {
            this.lastFocus = document.activeElement;
          }

          if (optionsRef.autofocus) {
            this.reference.focus();
          }

          this.focusFirstChild();
        } else {
          this.restoreFocus();
        }
      },
      focusFirstChild() {
        if (this.reference !== null && optionsRef.focusFirstChild) {
          const firstFocusable = this.reference.querySelectorAll<T>(`
            button:not([disabled]):not([disabled=disabled]), 
            [href], 
            input:not([disabled]):not([readonly]):not([disabled=disabled]):not([readonly=readonly]), 
            select:not([disabled]):not([readonly]):not([disabled=disabled]):not([readonly=readonly]), 
            textarea:not([disabled]):not([readonly]):not([disabled=disabled]):not([readonly=readonly]), 
            [tabindex]:not([tabindex="-1"])`);

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
      restoreFocus() {
        if (this.lastFocus?.tabIndex === -1) {
          return;
        }

        this.lastFocus?.focus();
        this.lastFocus = null;
      },
    }),
    {
      focus: observable.ref,
      lastFocus: observable.ref,
      reference: observable.ref,
      setRef: action.bound,
      updateFocus: action.bound,
      restoreFocus: action.bound,
    },
    false,
    undefined,
    'useFocus',
  );

  const reference = state.reference;
  useLayoutEffect(() => {
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

    state.updateFocus();

    return () => {
      reference.removeEventListener('focusin', focusHandler);
      reference.removeEventListener('focusout', blurHandler);
    };
    // TODO: probably we need to create a PR to https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks for custom stable hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  useLayoutEffect(
    () => () => {
      state.restoreFocus();
    },
    [],
  );

  return [state.setRef, state];
}
