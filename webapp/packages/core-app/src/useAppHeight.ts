/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect } from 'react';

import { throttle } from '@cloudbeaver/core-utils';

// we need it because 100vh cuts the bottom of the page on mobile devices
const handleBodyHeight = throttle(() => {
  const doc = document.documentElement;
  doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}, 50);

export function useAppHeight() {
  useLayoutEffect(() => {
    handleBodyHeight();
    window.addEventListener('resize', handleBodyHeight);

    return () => {
      window.removeEventListener('resize', handleBodyHeight);
    };
  });
}
