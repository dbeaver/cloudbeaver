/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

interface Props {
  open?: boolean;
  className?: string;
}

export const SlideBox: React.FC<Props> = function SlideBox({ children, className }) {
  const divRef = useRef<HTMLDivElement>(null);

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
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
};
