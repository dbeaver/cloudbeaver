/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { s, useHotkeys, useMergeRefs, useS } from '../index.js';
import SlideBoxStyles from './SlideBox.module.css';
import SlideBoxElementStyles from './SlideElement.module.css';
import SlideBoxOverlayStyles from './SlideOverlay.module.css';

interface Props {
  className?: string;
  children?: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export const SlideBox = observer<Props>(function SlideBox({ children, open, className, onClose }) {
  const slideBoxStyles = useS(SlideBoxStyles);
  const slideBoxElementStyles = useS(SlideBoxElementStyles);
  const slideBoxOverlayStyles = useS(SlideBoxOverlayStyles);

  const divRef = useRef<HTMLDivElement>(null);
  const ref = useHotkeys('escape', () => onClose?.(), { enabled: open });
  const mergedRefs = useMergeRefs(ref, divRef);

  useEffect(() => {
    const div = divRef.current;

    function handleScroll() {
      if (div) {
        div.scrollLeft = 0;
        div.scrollTop = 0;
      }
    }

    if (div) {
      div.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (div) {
        div.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div
      ref={mergedRefs}
      className={s(slideBoxStyles, { slideBox: true }, s(slideBoxElementStyles, { open }), s(slideBoxOverlayStyles, { open }), className)}
    >
      {children}
    </div>
  );
});
