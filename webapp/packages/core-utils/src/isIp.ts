/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isIp(host: string): boolean {
  // Matches IPv4 like 127.0.0.1
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)$/;

  // Matches IPv6 like [2001:0db8::1]
  const ipv6 = /^\[?([a-f0-9:]+)\]?$/i;

  return ipv4.test(host) || ipv6.test(host);
}
