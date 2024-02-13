/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';

import { ANONYMOUS_USER_ID, UserInfoResource } from '@cloudbeaver/core-authentication';
import { useExecutor } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { SessionExpireService, SessionResource } from '@cloudbeaver/core-root';
import { throttle } from '@cloudbeaver/core-utils';

const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

export function useSession() {
  const sessionExpireService = useService(SessionExpireService);
  const userInfoResource = useService(UserInfoResource);
  const sessionResource = useService(SessionResource);
  const isSubscribed = useRef(false);

  const touchSession = throttle(() => sessionResource.touchSession(), SESSION_TOUCH_TIME_PERIOD);

  function subscribeEvents() {
    if (!isSubscribed.current) {
      document.addEventListener('mousemove', touchSession);
      document.addEventListener('click', touchSession);
      document.addEventListener('keydown', touchSession);
      document.addEventListener('scroll', touchSession);
      isSubscribed.current = true;
    }
  }

  function unsubscribeEvents() {
    if (isSubscribed.current) {
      document.removeEventListener('mousemove', touchSession);
      document.removeEventListener('click', touchSession);
      document.removeEventListener('keydown', touchSession);
      document.removeEventListener('scroll', touchSession);
      isSubscribed.current = false;
    }
  }

  useExecutor({
    executor: userInfoResource.onUserChange,
    handlers: [
      function (data) {
        if (data === ANONYMOUS_USER_ID) {
          unsubscribeEvents();
          return;
        }

        subscribeEvents();
      },
    ],
  });

  useExecutor({
    executor: userInfoResource.onDataUpdate,
    handlers: [subscribeEvents],
  });

  useExecutor({
    executor: sessionResource.onDataOutdated,
    handlers: [unsubscribeEvents],
  });

  useExecutor({
    executor: sessionResource.onDataUpdate,
    handlers: [subscribeEvents],
  });

  useExecutor({
    executor: sessionExpireService.onSessionExpire,
    handlers: [unsubscribeEvents],
  });

  useEffect(() => {
    if (userInfoResource.isAuthorized) {
      subscribeEvents();
    }

    return () => {
      unsubscribeEvents();
    };
  }, []);
}
