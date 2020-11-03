/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

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

  return isShowContent;
}
