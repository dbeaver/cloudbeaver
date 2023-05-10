import { createComplexLoader } from '@cloudbeaver/core-blocks';

export * from './EditorLoader';
export * from './IEditorProps';
export * from './IEditorRef';
export * from './getDefaultExtensions';
export * from './useEditorAutocompletion';

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
