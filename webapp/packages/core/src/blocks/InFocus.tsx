import React, {
  useEffect, useRef, ReactElement, MutableRefObject
} from 'react';

type InFocusProps = {
  children: ReactElement;
}

export function InFocus({ children }: InFocusProps) {
  const isFirstRender: MutableRefObject<boolean> = useRef(true);
  const childRef: MutableRefObject<HTMLElement | null> = useRef(null);

  useEffect(() => {
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
