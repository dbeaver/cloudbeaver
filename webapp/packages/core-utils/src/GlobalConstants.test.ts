/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { GlobalConstants } from './GlobalConstants';

jest.mock('./isValidUrl', () => ({
  isValidUrl: jest.fn().mockReturnValue(false),
}));

jest.mock('./pathJoin', () => ({
  pathJoin: jest.fn((...args: string[]) => args.reduce((acc, arg) => acc + arg, '')),
}));

describe('GlobalConstants', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        host: 'localhost',
      },
    });
  });

  beforeEach(() => {
    (global as any)._DEV_ = true;
    (global as any)._VERSION_ = '1.0.0';
    (global as any)._ROOT_URI_ = '{ROOT_URI}';

    window.location.protocol = 'http:';
    window.location.host = 'localhost';
  });

  it('should return correct dev value', () => {
    expect(GlobalConstants.dev).toBe(true);
  });

  it('should return correct version value', () => {
    expect(GlobalConstants.version).toBe('1.0.0');
  });

  it('should return correct protocol value', () => {
    expect(GlobalConstants.protocol).toBe('http:');
  });

  it('should return correct host value', () => {
    expect(GlobalConstants.host).toBe('localhost');
  });

  it('should return correct websocket protocol', () => {
    expect(GlobalConstants.wsProtocol).toBe('ws:');

    window.location.protocol = 'https:';

    expect(GlobalConstants.wsProtocol).toBe('wss:');
  });

  it('should return correct rootURI value', () => {
    expect(GlobalConstants.rootURI).toBe('/');

    (global as any)._ROOT_URI_ = 'http://localhost:8080';
    (require('./isValidUrl').isValidUrl as jest.Mock).mockReturnValueOnce(true);

    expect(GlobalConstants.rootURI).toBe('/');

    (global as any)._ROOT_URI_ = '/dbeaver';
    expect(GlobalConstants.rootURI).toBe('/dbeaver/');
  });

  it('should return correct serviceURI value', () => {
    expect(GlobalConstants.serviceURI).toBe('/api');
  });

  it('should return correct health check url', () => {
    expect(GlobalConstants.getHealthCheckUrl('http://localhost')).toBe('http://localhost/status');
    expect(GlobalConstants.getHealthCheckUrl('')).toBe('/status');
  });

  it('should generate absolute root url', () => {
    expect(GlobalConstants.absoluteRootUrl('test/', 'test2')).toBe('/test/test2');
  });

  it('should generate absolute service url', () => {
    expect(GlobalConstants.absoluteServiceUrl('/test/', 'test2')).toBe('/api/test/test2');
  });

  it('should generate absoluteServiceHTTPUrl', () => {
    expect(GlobalConstants.absoluteServiceHTTPUrl('/test/', 'test2')).toBe('http://localhost/api/test/test2');
  });

  it('should generate absoluteServiceWSUrl', () => {
    expect(GlobalConstants.absoluteServiceWSUrl('/test/', 'test2')).toBe('ws://localhost/api/test/test2');

    window.location.protocol = 'https:';

    expect(GlobalConstants.absoluteServiceWSUrl('/test/', 'test2')).toBe('wss://localhost/api/test/test2');
  });

  it('should generate absolute url', () => {
    expect(GlobalConstants.absoluteUrl('test/', 'test2')).toBe('/test/test2');
    expect(GlobalConstants.absoluteUrl('platform:test/', 'test2')).toBe('/apiimages/test/test2');
  });
});
