/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef, useEffect, useState } from 'react';

export function useFocus(
  onFocus?: () => void,
  onBlur?: () => void
): [React.RefObject<HTMLElement>, boolean] {
  const [focus, setFocus] = useState(false);
  const reference = useRef<HTMLElement>(null);

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

    reference.current.addEventListener('focusin', focusHandler);
    reference.current.addEventListener('focusout', blurHandler);

    return () => {
      reference.current?.removeEventListener('focusin', focusHandler);
      reference.current?.removeEventListener('focusout', blurHandler);
    };
  }, [reference.current, onFocus, onBlur]);

  return [reference, focus];
}
