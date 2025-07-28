import { describe, it, expect } from 'vitest';
import { parseJdbcUri } from './parseJdbcUri.js';

describe('parseJdbcUri', () => {
  describe('invalid inputs', () => {
    it('should handle null input', () => {
      const result = parseJdbcUri(null);
      expect(result).toEqual({
        raw: '',
        subprotocol: '',
        subname: '',
        queryParams: {},
      });
    });

    it('should handle undefined input', () => {
      const result = parseJdbcUri(undefined);
      expect(result).toEqual({
        raw: '',
        subprotocol: '',
        subname: '',
        queryParams: {},
      });
    });

    it('should handle empty string', () => {
      const result = parseJdbcUri('');
      expect(result).toEqual({
        raw: '',
        subprotocol: '',
        subname: '',
        queryParams: {},
      });
    });

    it('should handle non-string input', () => {
      const result = parseJdbcUri(123 as any);
      expect(result).toEqual({
        raw: '123',
        subprotocol: '',
        subname: '',
        queryParams: {},
      });
    });
  });

  describe('non-jdbc URLs', () => {
    it('should handle non-jdbc URLs', () => {
      const result = parseJdbcUri('https://example.com');
      expect(result).toEqual({
        raw: 'https://example.com',
        subprotocol: '',
        subname: 'https://example.com',
        queryParams: {},
      });
    });

    it('should handle plain text', () => {
      const result = parseJdbcUri('just some text');
      expect(result).toEqual({
        raw: 'just some text',
        subprotocol: '',
        subname: 'just some text',
        queryParams: {},
      });
    });
  });

  describe('malformed jdbc URLs', () => {
    it('should handle jdbc: without subprotocol', () => {
      const result = parseJdbcUri('jdbc:');
      expect(result).toEqual({
        raw: 'jdbc:',
        subprotocol: '',
        subname: '',
        queryParams: {},
      });
    });

    it('should handle jdbc: with only subprotocol', () => {
      const result = parseJdbcUri('jdbc:mysql');
      expect(result).toEqual({
        raw: 'jdbc:mysql',
        subprotocol: '',
        subname: 'mysql',
        queryParams: {},
      });
    });
  });

  describe('SQLite URLs', () => {
    it('should parse SQLite file path', () => {
      const result = parseJdbcUri('jdbc:sqlite:/path/to/file.db');
      expect(result).toEqual({
        raw: 'jdbc:sqlite:/path/to/file.db',
        subprotocol: 'sqlite',
        subname: '/path/to/file.db',
        database: '/path/to/file.db',
        queryParams: {},
      });
    });

    it('should parse SQLite relative path', () => {
      const result = parseJdbcUri('jdbc:sqlite:file.db');
      expect(result).toEqual({
        raw: 'jdbc:sqlite:file.db',
        subprotocol: 'sqlite',
        subname: 'file.db',
        database: 'file.db',
        queryParams: {},
      });
    });

    it('should parse SQLite in-memory database', () => {
      const result = parseJdbcUri('jdbc:sqlite::memory:');
      expect(result).toEqual({
        raw: 'jdbc:sqlite::memory:',
        subprotocol: 'sqlite',
        subname: ':memory:',
        database: ':memory:',
        queryParams: {},
      });
    });
  });

  describe('Oracle Thin URLs', () => {
    it('should parse Oracle Thin with host, port, and SID', () => {
      const result = parseJdbcUri('jdbc:oracle:thin:@localhost:1521:XE');
      expect(result).toEqual({
        raw: 'jdbc:oracle:thin:@localhost:1521:XE',
        subprotocol: 'oracle',
        subname: 'thin:@localhost:1521:XE',
        host: 'localhost',
        port: '1521',
        database: 'XE',
        queryParams: {},
      });
    });

    it('should handle malformed Oracle Thin URL', () => {
      const result = parseJdbcUri('jdbc:oracle:thin:@localhost');
      expect(result).toEqual({
        raw: 'jdbc:oracle:thin:@localhost',
        subprotocol: 'oracle',
        subname: 'thin:@localhost',
        queryParams: {},
      });
    });

    it('should handle Oracle Thin with different format', () => {
      const result = parseJdbcUri('jdbc:oracle:thin:@localhost:1521');
      expect(result).toEqual({
        raw: 'jdbc:oracle:thin:@localhost:1521',
        subprotocol: 'oracle',
        subname: 'thin:@localhost:1521',
        queryParams: {},
      });
    });
  });

  describe('standard JDBC URLs with //', () => {
    it('should parse MySQL URL with host and port', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/testdb');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/testdb',
        subprotocol: 'mysql',
        subname: '//localhost:3306/testdb',
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        queryParams: {},
      });
    });

    it('should parse PostgreSQL URL without port', () => {
      const result = parseJdbcUri('jdbc:postgresql://localhost/mydb');
      expect(result).toEqual({
        raw: 'jdbc:postgresql://localhost/mydb',
        subprotocol: 'postgresql',
        subname: '//localhost/mydb',
        host: 'localhost',
        port: undefined,
        database: 'mydb',
        queryParams: {},
      });
    });

    it('should parse URL with credentials', () => {
      const result = parseJdbcUri('jdbc:mysql://user:pass@localhost:3306/testdb');
      expect(result).toEqual({
        raw: 'jdbc:mysql://user:pass@localhost:3306/testdb',
        subprotocol: 'mysql',
        subname: '//user:pass@localhost:3306/testdb',
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        username: 'user',
        password: 'pass',
        queryParams: {},
      });
    });

    it('should parse URL with query parameters', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/testdb?useSSL=false&serverTimezone=UTC');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/testdb?useSSL=false&serverTimezone=UTC',
        subprotocol: 'mysql',
        subname: '//localhost:3306/testdb?useSSL=false&serverTimezone=UTC',
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        queryParams: {
          useSSL: 'false',
          serverTimezone: 'UTC',
        },
      });
    });

    it('should parse URL with empty query parameter', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/testdb?param1=&param2=value');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/testdb?param1=&param2=value',
        subprotocol: 'mysql',
        subname: '//localhost:3306/testdb?param1=&param2=value',
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        queryParams: {
          param1: '',
          param2: 'value',
        },
      });
    });

    it('should handle URL-encoded query parameters', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/testdb?param1=value%20with%20spaces&param2=value%3Dtest');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/testdb?param1=value%20with%20spaces&param2=value%3Dtest',
        subprotocol: 'mysql',
        subname: '//localhost:3306/testdb?param1=value%20with%20spaces&param2=value%3Dtest',
        host: 'localhost',
        port: '3306',
        database: 'testdb',
        queryParams: {
          param1: 'value with spaces',
          param2: 'value=test',
        },
      });
    });

    it('should handle malformed URL gracefully', () => {
      const result = parseJdbcUri('jdbc:mysql://:3306/testdb');
      expect(result).toEqual({
        raw: 'jdbc:mysql://:3306/testdb',
        subprotocol: 'mysql',
        subname: '//:3306/testdb',
        host: undefined,
        port: '3306',
        database: 'testdb',
        queryParams: {},
      });
    });
  });

  describe('template placeholders', () => {
    it('should handle host placeholder', () => {
      const result = parseJdbcUri('jdbc:mysql://{host}:3306/testdb');
      expect(result).toEqual({
        raw: 'jdbc:mysql://{host}:3306/testdb',
        subprotocol: 'mysql',
        subname: '//{host}:3306/testdb',
        host: undefined,
        port: '3306',
        database: '/{host}:3306/testdb',
        queryParams: {},
      });
    });

    it('should handle port placeholder', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:{port}/testdb');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:{port}/testdb',
        subprotocol: 'mysql',
        subname: '//localhost:{port}/testdb',
        host: 'localhost',
        port: undefined,
        database: '/localhost:{port}/testdb',
        queryParams: {},
      });
    });

    it('should handle database placeholder', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/{database}');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/{database}',
        subprotocol: 'mysql',
        subname: '//localhost:3306/{database}',
        host: 'localhost',
        port: '3306',
        database: '/localhost:3306/{database}',
        queryParams: {},
      });
    });

    it('should handle multiple placeholders', () => {
      const result = parseJdbcUri('jdbc:mysql://{host}:{port}/{database}');
      expect(result).toEqual({
        raw: 'jdbc:mysql://{host}:{port}/{database}',
        subprotocol: 'mysql',
        subname: '//{host}:{port}/{database}',
        host: undefined,
        port: undefined,
        database: '/{host}:{port}/{database}',
        queryParams: {},
      });
    });

    it('should handle placeholders with query parameters', () => {
      const result = parseJdbcUri('jdbc:mysql://{host}:{port}/{database}?useSSL=false');
      expect(result).toEqual({
        raw: 'jdbc:mysql://{host}:{port}/{database}?useSSL=false',
        subprotocol: 'mysql',
        subname: '//{host}:{port}/{database}?useSSL=false',
        host: undefined,
        port: undefined,
        database: '/{host}:{port}/{database}',
        queryParams: {
          useSSL: 'false',
        },
      });
    });
  });

  describe('other JDBC formats', () => {
    it('should handle simple subname as database', () => {
      const result = parseJdbcUri('jdbc:hsqldb:mem:testdb');
      expect(result).toEqual({
        raw: 'jdbc:hsqldb:mem:testdb',
        subprotocol: 'hsqldb',
        subname: 'mem:testdb',
        database: 'mem:testdb',
        queryParams: {},
      });
    });

    it('should handle Derby embedded', () => {
      const result = parseJdbcUri('jdbc:derby:testdb;create=true');
      expect(result).toEqual({
        raw: 'jdbc:derby:testdb;create=true',
        subprotocol: 'derby',
        subname: 'testdb;create=true',
        database: 'testdb;create=true',
        queryParams: {},
      });
    });
  });

  describe('edge cases', () => {
    it('should handle URL with only host', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost',
        subprotocol: 'mysql',
        subname: '//localhost',
        host: 'localhost',
        port: undefined,
        database: undefined,
        queryParams: {},
      });
    });

    it('should handle URL with host and port but no database', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306',
        subprotocol: 'mysql',
        subname: '//localhost:3306',
        host: 'localhost',
        port: '3306',
        database: undefined,
        queryParams: {},
      });
    });

    it('should handle URL with empty database', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/',
        subprotocol: 'mysql',
        subname: '//localhost:3306/',
        host: 'localhost',
        port: '3306',
        database: undefined,
        username: undefined,
        password: undefined,
        queryParams: {},
      });
    });

    it('should handle URL with only query parameters', () => {
      const result = parseJdbcUri('jdbc:mysql://localhost:3306/?param1=value1');
      expect(result).toEqual({
        raw: 'jdbc:mysql://localhost:3306/?param1=value1',
        subprotocol: 'mysql',
        subname: '//localhost:3306/?param1=value1',
        host: 'localhost',
        port: '3306',
        database: undefined,
        username: undefined,
        password: undefined,
        queryParams: {
          param1: 'value1',
        },
      });
    });
  });
});