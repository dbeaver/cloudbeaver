/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { AIProfile } from './UserAIProfileResource.js';

export function supportsUserCredentials(properties: ReadonlyArray<{ id?: string; features: readonly string[] }>): boolean {
  return properties.some(property => property.id === 'token' && property.features.includes('password'));
}

export function requireGlobalProfileToken<T extends { id?: string; required: boolean }>(properties: readonly T[], global: boolean): T[] {
  return properties.map(property => (global && property.id === 'token' ? { ...property, required: true } : property));
}

export function requiresUserCredentials(profile: Pick<AIProfile, 'global' | 'credentialsSaved'>): boolean {
  return !profile.global && !profile.credentialsSaved;
}
