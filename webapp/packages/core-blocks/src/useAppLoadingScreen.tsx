import { useLayoutEffect } from 'react';

function onTransitionEnd(this: HTMLElement) {
  this.classList.add('app-loading-screen--hidden');
}

export function useAppLoadingScreen() {
  useLayoutEffect(() => {
    const appLoadingScreen = document.getElementById('app-loading-screen');

    if (!appLoadingScreen) {
      console.warn('Can"t find any node with "app-loading-screen" id');
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

    return () => appLoadingScreen.removeEventListener('transitionend', onTransitionEnd);
  }, []);
}
