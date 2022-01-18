/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';
import styled from 'reshadow';

import { Icon } from '../Icons';
import styles from './loading-screen.css';

const FADE_IN_DELAY = 300;

function LoadingScreen() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      const appContainer = document.querySelector('#__next')!;
      const loadingNode = appContainer.appendChild(ref.current!.cloneNode(true));
      setTimeout(() => (loadingNode as any).classList.add(styles.fadeIn));
      setTimeout(() => appContainer.removeChild(loadingNode), FADE_IN_DELAY);
    },
    []
  );

  return styled(styles)(
    <div ref={ref}>
      <Icon name="logo" viewBox="0 0 1755.6533 681.13202" />
    </div>
  );
}
