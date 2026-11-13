/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { parse, type SemVer } from 'semver';

export function parseProductVersion(version: string): { base: SemVer; hotfixVersion: number; release: string } | null {
  const match = /^v?(\d+\.\d+\.\d+)(?:\.(0|[1-9]\d*))?((?:[-+].*)?)$/.exec(version.trim());

  if (!match) {
    return null;
  }

  // OSGi build timestamps are qualifiers, not hotfix numbers.
  const buildQualifier = /^\d{12}(?:\d{2})?$/.test(match[2] ?? '');
  const hotfixVersion = buildQualifier ? 0 : Number(match[2] ?? 0);
  const base = parse(`${match[1]}${match[3]}`);

  if (!base || !Number.isSafeInteger(hotfixVersion)) {
    return null;
  }

  return {
    base,
    hotfixVersion,
    release: `${match[1]}${hotfixVersion > 0 ? `.${hotfixVersion}` : ''}`,
  };
}

export function compareProductVersions(first: string, second: string): number {
  const a = parseProductVersion(first);
  const b = parseProductVersion(second);

  if (!a || !b) {
    return NaN;
  }

  return a.base.compareMain(b.base) || Math.sign(a.hotfixVersion - b.hotfixVersion) || a.base.comparePre(b.base);
}
