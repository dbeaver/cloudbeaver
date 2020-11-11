import { useEffect } from 'react';

export function useAppLoadingSreen() {
  useEffect(() => {
    const appLoadingScreen = document.getElementById('app-loading-screen');
    if (!appLoadingScreen) {
      return;
    }

    const onTransitionEnd = () => {
      appLoadingScreen.style.display = 'none';
    };

    appLoadingScreen.addEventListener('transitionend', onTransitionEnd);
    appLoadingScreen.classList.add('app-loading-screen--fade-out');

    return () => appLoadingScreen.removeEventListener('transitionend', onTransitionEnd);
  }, []);
}
