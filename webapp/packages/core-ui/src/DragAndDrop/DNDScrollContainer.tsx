/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

import { useMergeRefs, useMouse } from '@cloudbeaver/core-blocks';

const EDGE = 60;
const MAX_SPEED = 12;

export interface IDNDScrollContainerProps {
  isDragging: boolean;
  className?: string;
  children: React.ReactNode;
}

export const DNDScrollContainer = observer(
  forwardRef<HTMLDivElement, IDNDScrollContainerProps>(function DNDScrollContainer({ isDragging, className, children }, externalRef) {
    const innerRef = useRef<HTMLDivElement>(null);
    const speedRef = useRef(0);
    const rafRef = useRef<number>(null);

    const mouse = useMouse<HTMLDivElement>();

    const el = innerRef.current;

    if (isDragging && el && mouse.state.position) {
      const y = mouse.state.position.y;
      const h = el.getBoundingClientRect().height;

      if (y < EDGE) {
        speedRef.current = -MAX_SPEED * Math.min((EDGE - y) / EDGE, 1);
      } else if (y > h - EDGE) {
        speedRef.current = MAX_SPEED * Math.min((y - (h - EDGE)) / EDGE, 1);
      } else {
        speedRef.current = 0;
      }
    } else {
      speedRef.current = 0;
    }

    useEffect(() => {
      if (!isDragging) {
        return;
      }

      // rAF loop for smooth scrolling
      const loop = () => {
        const node = innerRef.current;

        if (node && speedRef.current !== 0) {
          node.scrollTop += speedRef.current;
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);

      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }, [isDragging]);

    const ref = useMergeRefs(innerRef, mouse.reference, externalRef);

    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }),
);
