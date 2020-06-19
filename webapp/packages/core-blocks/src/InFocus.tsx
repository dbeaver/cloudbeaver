/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, {
  useLayoutEffect, useRef, ReactElement, MutableRefObject
} from 'react';

type InFocusProps = {
  children: ReactElement;
}

export function InFocus({ children }: InFocusProps) {
  const isFirstRender: MutableRefObject<boolean> = useRef(true);
  const childRef: MutableRefObject<HTMLElement | null> = useRef(null);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (childRef.current !== null) {
        const firstFocusable: HTMLElement | null = childRef.current
          .querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
          firstFocusable.focus();
        }

      }
    }
  });
  const childElement = React.Children.only(children);
  return React.cloneElement(
    childElement,
    { ref: (el: HTMLElement) => childRef.current = el }
  );
}
