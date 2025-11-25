/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)\.(25[0-5]|2[0-4]\d|1\d\d|\d\d?)$/;

export function isIp(host: string): boolean {
  if (!host) {
    return false;
  }

  const trimmedHost = host.trim();

  return isIPv4(trimmedHost) || isIPv6(trimmedHost);
}

function isIPv4(host: string): boolean {
  return IPV4_REGEX.test(host);
}

function isIPv6(host: string): boolean {
  const candidate = normalizeIPv6(host);

  if (!candidate) {
    return false;
  }

  try {
    const url = new URL(`http://${candidate}`);

    return url.hostname.startsWith('[') && url.hostname.endsWith(']');
  } catch {
    return false;
  }
}

function normalizeIPv6(host: string): string | null {
  const startsWithBracket = host.startsWith('[');
  const endsWithBracket = host.endsWith(']');

  if (startsWithBracket !== endsWithBracket) {
    return null;
  }

  if (startsWithBracket) {
    return host;
  }

  if (host.includes('[') || host.includes(']')) {
    return null;
  }

  return `[${host}]`;
}
