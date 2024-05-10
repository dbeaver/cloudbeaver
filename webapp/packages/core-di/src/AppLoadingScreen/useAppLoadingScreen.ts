/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect } from 'react';

function onTransitionEnd(this: HTMLElement) {
  this.classList.add('app-loading-screen--hidden');
}

export function useAppLoadingScreen() {
  useLayoutEffect(() => {
    const appLoadingScreen = document.getElementById('app-loading-screen');

    if (!appLoadingScreen) {
      return;
    }

    if (appLoadingScreen.classList.contains('app-loading-screen--fade-out')) {
      appLoadingScreen.classList.remove('app-loading-screen--fade-out');
      console.warn('#app-loading-screen already has "app-loading-screen--fade-out" class');
    }

    if (appLoadingScreen.classList.contains('app-loading-screen--hidden')) {
      appLoadingScreen.classList.remove('app-loading-screen--hidden');
      console.warn('#app-loading-screen already has "app-loading-screen--hidden" class');
    }

    appLoadingScreen.addEventListener('transitionend', onTransitionEnd);
    appLoadingScreen.classList.add('app-loading-screen--fade-out');

    return () => {
      appLoadingScreen.removeEventListener('transitionend', onTransitionEnd);
      appLoadingScreen.classList.remove('app-loading-screen--fade-out', 'app-loading-screen--hidden');
    };
  }, []);
}
