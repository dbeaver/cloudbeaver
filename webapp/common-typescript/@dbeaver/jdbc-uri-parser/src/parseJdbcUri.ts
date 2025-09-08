import type { JdbcUriBase } from './JdbcUriBase.js';
import type { JdbcUriCommon } from './JdbcUriCommon.js';

export type JdbcUri = JdbcUriCommon;

// Helper function to parse query parameters safely
function parseQueryParams(query?: string): Record<string, string> {
  if (!query) return {};

  const params: Record<string, string> = {};
  try {
    for (const param of query.split('&')) {
      const [key, value] = param.split('=');
      if (key) {
        params[key] = value ? decodeURIComponent(value) : '';
      }
    }
  } catch {}

  return params;
}

export function parseJdbcUri(jdbcUrl: string | undefined | null): JdbcUri {
  if (!jdbcUrl || typeof jdbcUrl !== 'string') {
    return {
      raw: String(jdbcUrl || ''),
      subprotocol: '',
      subname: '',
      queryParams: {},
    };
  }

  if (!jdbcUrl.startsWith('jdbc:')) {
    return {
      raw: jdbcUrl,
      subprotocol: '',
      subname: jdbcUrl,
      queryParams: {},
    };
  }

  const raw = jdbcUrl;
  const match = jdbcUrl.match(/^jdbc:([^:]+):(.*)$/);

  if (!match) {
    return {
      raw: jdbcUrl,
      subprotocol: '',
      subname: jdbcUrl.substring(5),
      queryParams: {},
    };
  }

  const [, subprotocol, subname] = match as [string, string, string];
  const base: JdbcUriBase = { raw, subprotocol, subname };

  // Protocol-specific handling

  // SQLite: jdbc:sqlite:/path/to/file.db
  if (subprotocol === 'sqlite') {
    return {
      ...base,
      database: subname,
      queryParams: {},
    };
  }

  // Oracle Thin: jdbc:oracle:thin:@host:port:sid
  if (subprotocol === 'oracle' && subname.startsWith('thin:@')) {
    const match = subname.match(/^thin:@([^:]+):(\d+):(.+)$/);
    if (match) {
      const [, host, port, database] = match;
      return { ...base, host, port, database, queryParams: {} };
    }
    return { ...base, queryParams: {} };
  }

  // Handle URL-like formats (most JDBC URLs)
  if (subname.startsWith('//')) {
    // Extract query string if present
    const queryMatch = subname.match(/\?(.+)$/);
    const queryString = queryMatch?.[1];
    const queryParams = parseQueryParams(queryString);

    // Strip query string for further parsing
    const subnameWithoutQuery = queryString ? subname.substring(0, subname.length - queryString.length - 1) : subname;

    // Check for template placeholders
    if (/\{[^{}]+\}/.test(subnameWithoutQuery)) {
      const hostMatch = subnameWithoutQuery.match(/\/\/([^:/]+|\{[^{}]+\})/);
      const portMatch = subnameWithoutQuery.match(/\/\/(?:[^:/]+|\{[^{}]+\})(?::([^/]+|\{[^{}]+\}))?/);
      const databaseMatch = subnameWithoutQuery.match(/\/([^?]*)/);

      const host = hostMatch?.[1];
      const port = portMatch?.[1];
      const database = databaseMatch?.[1];

      return {
        ...base,
        host: host?.startsWith('{') ? undefined : host,
        port: port?.startsWith('{') ? undefined : port,
        database: database?.startsWith('{') ? undefined : database,
        queryParams,
      };
    }

    // Try standard URL parsing
    try {
      const fakeUrl = new URL(`${subprotocol}:${subnameWithoutQuery}`);
      return {
        ...base,
        host: fakeUrl.hostname || undefined,
        port: fakeUrl.port || undefined,
        database: fakeUrl.pathname?.slice(1) || undefined,
        username: fakeUrl.username || undefined,
        password: fakeUrl.password || undefined,
        queryParams,
      };
    } catch {
      // Fallback regex parsing for malformed URLs
      const regex = /^\/\/([^:/?#]+)?(?::(\d+))?(?:\/([^?]*))?/;
      const match = subnameWithoutQuery.match(regex);
      const [, host, port, database] = match || [];

      return {
        ...base,
        host,
        port,
        database,
        queryParams,
      };
    }
  }

  // Any other format - treat subname as database
  return {
    ...base,
    database: subname,
    queryParams: {},
  };
}
