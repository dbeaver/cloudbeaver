/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { clsx } from '@dbeaver/ui-kit';
import { ActionIconButton, getComputed, useClipboard, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import { SQLCodeEditor, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-codemirror';
import { useService } from '@cloudbeaver/core-di';
import { ConnectionDialectResource, ConnectionInfoResource } from '@cloudbeaver/core-connections';

import { AIChatMessageActionsService } from './AIChatMessageActionsService.js';
import { AIChatContext } from '../AIChatContext.js';

interface Props {
  code: string;
  language: string;
  conversationId: string;
  className?: string;
}

export const CodeFormatter = observer<Props>(function CodeFormatter({ code, conversationId, language, className }) {
  const translate = useTranslate();
  const context = useContext(AIChatContext);
  const aiChatMessageActionsService = useService(AIChatMessageActionsService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const connectionKey = context.connectionKey || null;
  const connectionDialectResource = useResource(CodeFormatter, ConnectionDialectResource, connectionKey, {
    active: getComputed(() => !connectionKey || connectionInfoResource.isConnected(connectionKey)),
  });

  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  const copy = useClipboard();

  if (sqlDialect) {
    extensions.set(...sqlDialect);
  }

  function execute() {
    aiChatMessageActionsService.executeQuery(conversationId, connectionKey, code);
  }

  function insertInEditor() {
    aiChatMessageActionsService.insertInEditor(conversationId, connectionKey, code);
  }

  const disabled = aiChatMessageActionsService.isDisabled || context.disabled || language !== 'sql';

  return (
    <div className={clsx('tw:flex tw:flex-wrap tw:border tw:border-[var(--theme-background)]', className)}>
      <div className="tw:flex tw:w-full tw:flex-wrap tw:items-center tw:justify-between tw:gap-1 tw:border-b tw:border-[var(--theme-background)] tw:px-2 tw:bg-[var(--theme-surface)]">
        <code className="tw:text-(--theme-text-hint-on-light)">{language}</code>
        <div className="tw:justify-end">
          <ActionIconButton
            name="/icons/sql_exec.svg"
            title={translate('plugin_ai_chat_query_execute')}
            hidden={!aiChatMessageActionsService.isAllowed(connectionKey)}
            disabled={disabled}
            img
            onClick={execute}
          />
          <ActionIconButton
            name="/icons/ai_insert_query.svg"
            title={translate('plugin_ai_chat_query_insert')}
            disabled={disabled}
            img
            onClick={insertInEditor}
          />
          <ActionIconButton name="/icons/ai_copy_query.svg" title={translate('plugin_ai_chat_query_copy')} img onClick={() => copy(code, true)} />
        </div>
      </div>

      <div className="tw:max-h-50 tw:flex-1 tw:bg-[var(--theme-surface)]">
        <SQLCodeEditor value={code} extensions={extensions} highlightActiveLine={false} readonly lineWrapping syntaxHighlighting />
      </div>
    </div>
  );
});
