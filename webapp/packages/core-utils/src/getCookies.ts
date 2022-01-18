/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

type Cookies = Partial<Record<string, string>>;

export function getCookies(): Cookies {
  if (!document.cookie) {
    return {};
  }

  return document.cookie.split('; ').reduce((cookies: Cookies, cookie: string) => {
    const [name, value] = cookie.split('=');
    cookies[name] = value;

    return cookies;
  }, {});
}
