/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';

import { getEditorContextSnapshot, matchesEditorSnapshot, type IAIChatEditorSnapshot } from './AIChatEditorContext.js';

const connectionKey = { projectId: 'project', connectionId: 'editor' };
const editorContext = { connectionKey, catalog: 'database', schema: 'public' };
const editor = {
  activeExecutionContext: {
    ...connectionKey,
    defaultCatalog: 'database',
    defaultSchema: 'public',
  },
  currentConnectionKey: connectionKey,
  currentObjectCatalogId: undefined,
  currentObjectSchemaId: undefined,
  isChangingConnection: false,
  isChangingConnectionContainer: false,
};

describe('AI Chat editor context snapshots', () => {
  it('recognizes the restored editor when its container resource was not loaded at capture time', () => {
    const snapshot = getEditorContextSnapshot(editor);

    expect(snapshot).toEqual({ editorContext, editorContextPending: false });

    const restored: IAIChatEditorSnapshot = JSON.parse(JSON.stringify(snapshot));
    expect(matchesEditorSnapshot(restored, editorContext)).toBe(true);
    expect(matchesEditorSnapshot(restored, { ...editorContext, schema: 'other' })).toBe(false);
  });

  it('preserves a pending connection snapshot across reload and recognizes its eventual defaults', () => {
    const snapshot = getEditorContextSnapshot({
      ...editor,
      isChangingConnection: true,
      currentConnectionKey: { projectId: 'project', connectionId: 'next' },
    });

    expect(snapshot).toEqual({
      editorContext: { connectionKey: { projectId: 'project', connectionId: 'next' } },
      editorContextPending: true,
    });

    const restored: IAIChatEditorSnapshot = JSON.parse(JSON.stringify(snapshot));
    expect(
      matchesEditorSnapshot(restored, {
        connectionKey: { projectId: 'project', connectionId: 'next' },
        catalog: 'next-database',
        schema: 'next-schema',
      }),
    ).toBe(true);

    expect(matchesEditorSnapshot(restored, editorContext)).toBe(false);
  });

  it('captures the pending schema rather than the still-active execution context', () => {
    const snapshot = getEditorContextSnapshot({
      ...editor,
      isChangingConnectionContainer: true,
      currentObjectCatalogId: 'database',
      currentObjectSchemaId: 'selected',
    });

    expect(matchesEditorSnapshot(snapshot, { ...editorContext, schema: 'selected' })).toBe(true);
    expect(matchesEditorSnapshot(snapshot, editorContext)).toBe(false);
  });

  it.each(['catalog', 'schema'] as const)('treats the first settled %s selection as an editor change', container => {
    const snapshot: IAIChatEditorSnapshot = {
      editorContext: { ...editorContext, [container]: undefined },
      editorContextPending: false,
    };

    expect(matchesEditorSnapshot(snapshot, editorContext)).toBe(false);
  });

  it.each([
    { projectId: 'other-project', connectionId: 'editor' },
    { projectId: 'project', connectionId: 'other-editor' },
  ])('detects a connection change to $projectId/$connectionId', nextConnection => {
    expect(matchesEditorSnapshot({ editorContext }, { ...editorContext, connectionKey: nextConnection })).toBe(false);
  });

  it('distinguishes an unrecorded editor from an editor without a connection', () => {
    expect(matchesEditorSnapshot({}, null)).toBe(false);

    const snapshot = getEditorContextSnapshot({ ...editor, activeExecutionContext: undefined, currentConnectionKey: null });
    expect(snapshot).toEqual({ editorContext: null, editorContextPending: false });
    expect(matchesEditorSnapshot(snapshot, null)).toBe(true);
    expect(matchesEditorSnapshot(snapshot, editorContext)).toBe(false);
  });
});
