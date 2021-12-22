/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

interface Props {
  open?: boolean;
  className?: string;
}

export const SlideBox: React.FC<Props> = function SlideBox({ children, className }) {
  const divRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={divRef} className={className}>
      {children}
    </div>
  );
};
