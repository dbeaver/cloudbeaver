/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createComplexLoader } from '@cloudbeaver/core-blocks';

export * from './ReactCodemirrorPanel.js';
export * from './EditorLoader.js';
export * from './IEditorProps.js';
export * from './IEditorRef.js';
export * from './useEditorDefaultExtensions.js';
export * from './useEditorAutocompletion.js';
export * from './useCodemirrorExtensions.js';

export * from './Hyperlink/HyperlinkLoader.js';
export * from './Hyperlink/IHyperlinkInfo.js';
export * from './Hyperlink/useHyperlink.js';

export * from '@codemirror/view';
export * from '@codemirror/state';
export * from '@codemirror/autocomplete';

export { html as HTML_EDITOR } from '@codemirror/lang-html';
export { javascript as JAVASCRIPT_EDITOR } from '@codemirror/lang-javascript';
export { json as JSON_EDITOR } from '@codemirror/lang-json';
export { sql as SQL_EDITOR, SQLDialect } from '@codemirror/lang-sql';
export { xml as XML_EDITOR } from '@codemirror/lang-xml';

export const StandardSQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).StandardSQL);
export const PostgreSQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).PostgreSQL);
export const MySQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).MySQL);
export const MariaSQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).MariaSQL);
export const MSSQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).MSSQL);
export const SQLiteLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).SQLite);
export const CassandraLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).Cassandra);
export const PLSQLLoader = createComplexLoader(async () => (await import('@codemirror/lang-sql')).PLSQL);
export { manifest as codemirror6Manifest } from './manifest.js';
