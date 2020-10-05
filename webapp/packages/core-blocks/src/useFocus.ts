/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useRef, useEffect, useState, useLayoutEffect
} from 'react';

type FocusOptions = {
  focusFirstChild?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function useFocus<T extends HTMLElement>({
  focusFirstChild,
  onFocus,
  onBlur,
}: FocusOptions): [React.RefObject<T>, boolean] {
  const [focus, setFocus] = useState(false);
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
      if (onFocus) {
        onFocus();
      }

      setFocus(true);
    };

    const blurHandler = () => {
      if (onBlur) {
        onBlur();
      }

      setFocus(false);
    };

    const element = reference.current;

    element.addEventListener('focusin', focusHandler);
    element.addEventListener('focusout', blurHandler);

    return () => {
      element.removeEventListener('focusin', focusHandler);
      element.removeEventListener('focusout', blurHandler);
    };
  }, [onFocus, onBlur]);

  return [reference, focus];
}
