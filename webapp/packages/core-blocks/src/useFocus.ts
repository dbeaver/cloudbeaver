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
}

export function useFocus<T extends HTMLElement>({
  focusFirstChild,
  onFocus,
  onBlur,
}: FocusOptions): [React.RefObject<T>, IState] {
  const handlersRef = useObjectRef({ onFocus, onBlur });
  // TODO: seems can be inconsistent when element changes
  const state = useObservableRef<IState>(
    () => ({ focus: false }),
    { focus: observable.ref },
    false,
    'useFocus'
  );
  const reference = useRef<T>(null);

  useLayoutEffect(() => {
    if (reference.current !== null && focusFirstChild) {
      const firstFocusable = reference.current
        .querySelector<T>('button, [href], input, select, textarea, [tabndex]:not([tabndex="-1"])');

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
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
