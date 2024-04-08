/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

let knownLogPatterns: any[][] = [];
let knownWarnPatterns: any[][] = [];
let knownErrorPatterns: any[][] = [];
let knownInfoPatterns: any[][] = [];
let knownDebugPatterns: any[][] = [];

let logSpy: jest.Spied<typeof console.log>;
let warnSpy: jest.Spied<typeof console.warn>;
let errorSpy: jest.Spied<typeof console.error>;
let infoSpy: jest.Spied<typeof console.info>;
let debugSpy: jest.Spied<typeof console.debug>;

beforeAll(() => {
  logSpy = jest.spyOn(console, 'log').mockImplementation((...args) => {
    if (filterPatterns(knownLogPatterns, args)) {
      return;
    }
    expect(logSpy).not.toHaveBeenCalledWith(...args);
  });
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((...args) => {
    if (filterPatterns(knownWarnPatterns, args)) {
      return;
    }
    expect(warnSpy).not.toHaveBeenCalledWith(...args);
  });
  errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (args[0] && String(args[0]).includes('Expected:')) {
      // skip exceptions from jest expect
      return;
    }
    if (args[0] && String(args[0]).includes('Error: Uncaught')) {
      // skip uncaught exceptions
      return;
    }
    if (filterPatterns(knownErrorPatterns, args)) {
      return;
    }
    expect(errorSpy).not.toHaveBeenCalledWith(...args);
  });
  infoSpy = jest.spyOn(console, 'info').mockImplementation((...args) => {
    if (filterPatterns(knownInfoPatterns, args)) {
      return;
    }
    expect(infoSpy).not.toHaveBeenCalledWith(...args);
  });
  debugSpy = jest.spyOn(console, 'debug').mockImplementation((...args) => {
    if (filterPatterns(knownDebugPatterns, args)) {
      return;
    }
    expect(debugSpy).not.toHaveBeenCalledWith(...args);
  });
});

beforeEach(() => {
  logSpy.mockClear();
  warnSpy.mockClear();
  errorSpy.mockClear();
  infoSpy.mockClear();
  debugSpy.mockClear();
});

afterAll(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errorSpy.mockRestore();
  infoSpy.mockRestore();
  debugSpy.mockRestore();

  knownLogPatterns = [];
  knownWarnPatterns = [];
  knownErrorPatterns = [];
  knownInfoPatterns = [];
  knownDebugPatterns = [];
});

function filterPatterns(patterns: any[][], args: any[]) {
  return patterns.some(pattern =>
    pattern.every((value, index) => {
      if (value instanceof RegExp) {
        return value.test(args[index]);
      }
      if (typeof value === 'function') {
        return value(args[index]);
      }
      return value === args[index];
    }),
  );
}

export const consoleSpy = {
  get log() {
    return logSpy;
  },
  get warn() {
    return warnSpy;
  },
  get error() {
    return errorSpy;
  },
  get info() {
    return infoSpy;
  },
  get debug() {
    return debugSpy;
  },
};

export function addKnownLog(...patterns: any[]) {
  knownLogPatterns.push(patterns);
}

export function addKnownWarn(...patterns: any[]) {
  knownWarnPatterns.push(patterns);
}

export function addKnownError(...patterns: any[]) {
  knownErrorPatterns.push(patterns);
}

export function addKnownInfo(...patterns: any[]) {
  knownInfoPatterns.push(patterns);
}

export function addKnownDebug(...patterns: any[]) {
  knownDebugPatterns.push(patterns);
}
