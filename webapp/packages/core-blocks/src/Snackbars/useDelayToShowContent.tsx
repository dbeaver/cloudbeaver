import { useEffect, useState } from 'react';

interface IUseDelayToShowContent {
  deletingDelay: boolean;
  showContentDelay: number;
}

export function useDelayToShowContent({ deletingDelay, showContentDelay }: IUseDelayToShowContent) {
  const [isShowContent, setIsShowContent] = useState(false);

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (deletingDelay) {
        return;
      }
      setIsShowContent(true);
    }, showContentDelay);

    return () => clearTimeout(timerId);
  }, [deletingDelay, showContentDelay]);

  return { isShowContent };
}
