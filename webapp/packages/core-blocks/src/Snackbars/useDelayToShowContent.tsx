/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';

export function useDelayToShowContent(animate: boolean, showContentDelay: number) {
  const [isShowContent, setIsShowContent] = useState(false);

  useEffect(() => {
    if (animate) {
      return;
    }
    const timerId = setTimeout(() => {
      setIsShowContent(true);
    }, showContentDelay);

    return () => clearTimeout(timerId);
  }, [animate, showContentDelay]);

  return isShowContent;
}
