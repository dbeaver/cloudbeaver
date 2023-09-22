/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { s, useS } from '../index';
import style from './SlideBox.m.css';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export const SlideBox = observer<Props>(function SlideBox({ children, className }) {
  const styles = useS(style);
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
    <div ref={divRef} className={s(styles, { slideBox: true }, className)}>
      {children}
    </div>
  );
});
