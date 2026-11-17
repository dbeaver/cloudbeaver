/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { compareVersions, validateStrict } from 'compare-versions';

export interface IParsedProductVersion {
  major: number;
  minor: number;
  patch: number;
  hotfixVersion: number;
  release: string;
  version: string;
}

export function parseProductVersion(version: string): IParsedProductVersion | null {
  const match = /^v?(\d+\.\d+\.\d+)(?:\.(0|[1-9]\d*))?(?:\.\d{12}(?:\d{2})?)?((?:[-+].*)?)$/.exec(version.trim());

  if (!match) {
    return null;
  }

  // OSGi build timestamps are qualifiers, not hotfix numbers.
  const buildQualifier = /^\d{12}(?:\d{2})?$/.test(match[2] ?? '');
  const hotfixVersion = buildQualifier ? 0 : Number(match[2] ?? 0);
  const [major, minor, patch] = match[1]!.split('.').map(Number);

  if (!validateStrict(`${match[1]}${match[3]}`) || ![major, minor, patch, hotfixVersion].every(Number.isSafeInteger)) {
    return null;
  }

  const release = `${match[1]}${hotfixVersion > 0 ? `.${hotfixVersion}` : ''}`;

  return {
    major: major!,
    minor: minor!,
    patch: patch!,
    hotfixVersion,
    release,
    version: `${release}${match[3]}`,
  };
}

export function compareProductVersions(first: string, second: string): number {
  const a = parseProductVersion(first);
  const b = parseProductVersion(second);

  if (!a || !b) {
    return NaN;
  }

  return compareVersions(a.version, b.version);
}
