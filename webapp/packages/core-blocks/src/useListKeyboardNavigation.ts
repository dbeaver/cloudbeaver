/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useState } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

export const EventKeyboardNavigationFlag = EventContext.create('useListKeyboardNavigation');

export function useListKeyboardNavigation<T extends HTMLElement>(elementsSelector = '[tabindex]:not(:disabled)'): (obj: T | null) => void {
  const [ref, setRef] = useState<T | null>(null);

  useEffect(() => {
    if (!ref) {
      return;
    }

    const getFocusableElements = () => {
      const allFocusableElements = Array.from(ref.querySelectorAll(elementsSelector)) as HTMLElement[];
      return allFocusableElements;
    };

    // Function to reset tabindex on all elements and set it to 0 on aria-selected="true"
    const resetTabindex = () => {
      const focusableElements = getFocusableElements();
      focusableElements.forEach(el => {
        if (el.getAttribute('aria-selected') === 'true') {
          el.setAttribute('tabindex', '0');
        } else {
          el.setAttribute('tabindex', '-1');
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (EventContext.has(e, EventKeyboardNavigationFlag) || !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        return;
      }

      const focusableElements = getFocusableElements();
      let currentIndex = focusableElements.findIndex(el => el === document.activeElement);

      if (document.activeElement !== ref && currentIndex === -1) {
        return;
      }

      let newIndex = currentIndex;

      EventContext.set(e, EventKeyboardNavigationFlag);
      e.preventDefault();

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          newIndex = (currentIndex + 1) % focusableElements.length; // Move to next element

          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          if (currentIndex === -1) {
            currentIndex = 0;
          }
          newIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length; // Move to previous element

          break;
        default:
          return;
      }

      // // Reset all tabindex to -1
      focusableElements.forEach(el => el.setAttribute('tabindex', '-1'));

      // Set the new element's tabindex to 0 and focus it
      const nextElement = focusableElements[newIndex];
      nextElement?.setAttribute('tabindex', '0');
      nextElement?.focus();
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Check if the focus moved outside the container
      if (!ref.contains(e.relatedTarget as Node)) {
        resetTabindex();
      }
    };

    ref.addEventListener('keydown', handleKeyDown);
    ref.addEventListener('focusout', handleFocusOut);

    return () => {
      ref.removeEventListener('keydown', handleKeyDown);
      ref.removeEventListener('focusout', handleFocusOut);
    };
  }, [ref, elementsSelector]);

  return setRef;
}
