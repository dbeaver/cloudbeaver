/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';

import type { IAIChatContextInfo } from './AIChatContextService.js';

export interface IAIChatEditorSnapshot {
  editorContext?: IAIChatContextInfo | null;
  editorContextPending?: boolean;
}

type EditorContextSource = Pick<
  ConnectionSchemaManagerService,
  'currentConnectionKey' | 'currentObjectCatalogId' | 'currentObjectSchemaId' | 'isChangingConnection' | 'isChangingConnectionContainer'
> & {
  activeExecutionContext?: Pick<IConnectionExecutionContextInfo, 'projectId' | 'connectionId' | 'defaultCatalog' | 'defaultSchema'> | null;
};

export function getEditorContextSnapshot(editor: EditorContextSource): IAIChatEditorSnapshot {
  const pending = editor.isChangingConnection || editor.isChangingConnectionContainer;
  const context = editor.activeExecutionContext;
  let editorContext: IAIChatContextInfo | null = null;

  if (pending) {
    // Pending selections take precedence over the still-active execution context.
    if (editor.currentConnectionKey) {
      editorContext = {
        connectionKey: editor.currentConnectionKey,
        catalog: editor.currentObjectCatalogId,
        schema: editor.currentObjectSchemaId,
      };
    }
  } else if (context) {
    // Use the same source as the synchronization reaction, even before resources load.
    editorContext = {
      connectionKey: { projectId: context.projectId, connectionId: context.connectionId },
      catalog: context.defaultCatalog,
      schema: context.defaultSchema,
    };
  }

  return { editorContext, editorContextPending: pending };
}

export function matchesEditorSnapshot(snapshot: IAIChatEditorSnapshot, context: IAIChatContextInfo | null | undefined): boolean {
  const previous = snapshot.editorContext;

  if (!previous || !context) {
    return previous === context;
  }

  const catalogMatches = (snapshot.editorContextPending && previous.catalog === undefined) || previous.catalog === context.catalog;
  const schemaMatches = (snapshot.editorContextPending && previous.schema === undefined) || previous.schema === context.schema;

  return (
    previous.connectionKey.projectId === context.connectionKey.projectId &&
    previous.connectionKey.connectionId === context.connectionKey.connectionId &&
    catalogMatches &&
    schemaMatches
  );
}
