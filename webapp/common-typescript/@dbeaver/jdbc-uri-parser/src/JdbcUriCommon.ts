import type { JdbcUriBase } from './JdbcUriBase.js';

export interface JdbcUriCommon extends JdbcUriBase {
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  queryParams: Record<string, string>;
}
