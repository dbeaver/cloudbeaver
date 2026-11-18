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
  micro: number;
  patch: number;
  release: string;
  version: string;
}

export function parseProductVersion(version: string): IParsedProductVersion | null {
  // Match major.minor.micro, an optional patch, an optional 12/14-digit build timestamp,
  // and a prerelease/build suffix (-beta.2/+build.7); also accept a leading "v".
  const match = /^v?(\d+\.\d+\.\d+)(?:\.(0|[1-9]\d*))?(?:\.\d{12}(?:\d{2})?)?((?:[-+].*)?)$/.exec(version.trim());

  if (!match) {
    return null;
  }

  const [, baseRelease = '', patchOrBuildTimestamp = '', prereleaseOrBuildSuffix = ''] = match;

  // OSGi build timestamps are qualifiers, not patch numbers.
  const buildQualifier = /^\d{12}(?:\d{2})?$/.test(patchOrBuildTimestamp);
  const patch = buildQualifier ? 0 : Number(patchOrBuildTimestamp);
  const [major, minor, micro] = baseRelease.split('.').map(Number);

  if (!validateStrict(`${baseRelease}${prereleaseOrBuildSuffix}`) || ![major, minor, micro, patch].every(Number.isSafeInteger)) {
    return null;
  }

  const release = `${baseRelease}${patch > 0 ? `.${patch}` : ''}`;

  return {
    major: major!,
    minor: minor!,
    micro: micro!,
    patch,
    release,
    version: `${release}${prereleaseOrBuildSuffix}`,
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
