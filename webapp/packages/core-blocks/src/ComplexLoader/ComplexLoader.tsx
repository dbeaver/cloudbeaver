/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

export interface ComplexLoaderProps<T> {
  loader: () => Promise<T>;
  placeholder: React.ReactElement;
  keepLoading?: boolean;
  children: (content: T) => JSX.Element;
}

export function ComplexLoader<T>(props: ComplexLoaderProps<T>) {
  const [content, setContent] = useState<T | null>(null);
  const notificationService = useService(NotificationService);

  useEffect(() => {
    let unmounted = false;
    if (!content) {
      props
        .loader()
        .then(value => !unmounted && setContent(value))
        .catch(exception => !unmounted && notificationService.logException(exception, 'Can\'t load resource'));
    }
    return () => {
      unmounted = true;
    };
  }, [content]);

  if (!content || props.keepLoading) {
    return props.placeholder;
  }

  return props.children(content);
}
