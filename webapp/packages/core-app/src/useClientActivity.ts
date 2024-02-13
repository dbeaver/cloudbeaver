/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';

import { ClientActivityService } from '@cloudbeaver/core-activity';
import { useService } from '@cloudbeaver/core-di';

export function useClientActivity() {
  const clientActivityService = useService(ClientActivityService);
  const isSubscribed = useRef(false);

  const updateActivity = () => clientActivityService.updateActivity();

  function subscribeEvents() {
    if (!isSubscribed.current) {
      document.addEventListener('mousemove', updateActivity);
      document.addEventListener('click', updateActivity);
      document.addEventListener('keydown', updateActivity);
      document.addEventListener('scroll', updateActivity);
      isSubscribed.current = true;
    }
  }

  function unsubscribeEvents() {
    if (isSubscribed.current) {
      document.removeEventListener('mousemove', updateActivity);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keydown', updateActivity);
      document.removeEventListener('scroll', updateActivity);
      isSubscribed.current = false;
    }
  }

  useEffect(() => {
    subscribeEvents();

    return () => {
      unsubscribeEvents();
    };
  }, []);
}
