/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';

import { ClientActivityService } from '@cloudbeaver/core-activity';
import { useService } from '@cloudbeaver/core-di';
import { throttle } from '@cloudbeaver/core-utils';

export function useClientActivity() {
  const clientActivityService = useService(ClientActivityService);

  const updateActivity = throttle(() => {
    clientActivityService.updateActivity();
  }, 300);

  function subscribeEvents() {
    document.addEventListener('mousemove', updateActivity);
    document.addEventListener('click', updateActivity);
    document.addEventListener('keydown', updateActivity);
    document.addEventListener('scroll', updateActivity);
  }

  function unsubscribeEvents() {
    document.removeEventListener('mousemove', updateActivity);
    document.removeEventListener('click', updateActivity);
    document.removeEventListener('keydown', updateActivity);
    document.removeEventListener('scroll', updateActivity);
  }

  useEffect(() => {
    subscribeEvents();

    return () => {
      unsubscribeEvents();
    };
  }, []);
}
