/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { compareProductVersions, parseProductVersion } from './productVersion.js';
import type { IVersion } from './VersionResource.js';

export function normalizeVersions(versions: readonly IVersion[]): IVersion[] {
  return versions.flatMap(version => {
    if (!version || typeof version.number !== 'string' || !parseProductVersion(version.number)) {
      return [];
    }

    const patches = Array.isArray(version.patches) ? version.patches : [];
    const releases: IVersion[] = [version];

    for (const patch of patches) {
      if (!patch || !Number.isSafeInteger(patch.patchNumber) || patch.patchNumber < 1 || typeof patch.releaseNotes !== 'string') {
        continue;
      }

      const number = `${version.number}.${patch.patchNumber}`;
      const parsed = parseProductVersion(number);

      if (!parsed || parsed.hotfixVersion !== patch.patchNumber) {
        continue;
      }

      releases.push({ number, date: '', releaseNotes: patch.releaseNotes });
    }

    return releases;
  });
}

export function getLatestVersion(versions: readonly IVersion[], latestVersionNumber: string | null): IVersion | undefined {
  const latest = versions.find(version => version.number === latestVersionNumber);

  return latest ? normalizeVersions([latest]).sort((a, b) => compareProductVersions(b.number, a.number))[0] : undefined;
}

export function getVersionReleaseNotes(versions: readonly IVersion[], number: string): IVersion[] {
  const selected = parseProductVersion(number);

  if (!selected) {
    return [];
  }

  return versions
    .filter(version => {
      const parsed = parseProductVersion(version.number);

      return (
        parsed?.major === selected.major &&
        parsed.minor === selected.minor &&
        parsed.patch === selected.patch &&
        compareProductVersions(version.number, number) <= 0
      );
    })
    .sort((a, b) => compareProductVersions(b.number, a.number));
}
