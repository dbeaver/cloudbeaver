/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { base64ToBlob } from './base64ToBlob.js';

const BASE_64_STRING =
  'iVBORw0KGgoAAAANSUhEUgAAAhAAAAEWCAIAAAC40zleAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAACydSURBVHhe7Z1rsF1VtecnkAcQkhgsjVJlW3xQEcWkeOV5njknhHhCUCAVIOQFQQIHbocgJCGPaum6RXjdEMWU3WmVRxQhXLttbt+riAKBW1QJlerYbW4CX/jiLZUqbvmlu/ph9xhzzNeaa+199pn7PPZa6/+rUTlzjTnmWHPD3uO/51p776n6lq';

describe('base64ToBlob', () => {
  it('should return a blob', () => {
    const blob = base64ToBlob(BASE_64_STRING);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/octet-stream');
    expect(blob.size).not.toBe(0);
  });

  it('should return a blob with the given mime type', () => {
    const blob = base64ToBlob(BASE_64_STRING, 'image/jpeg');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
    expect(blob.size).not.toBe(0);
  });

  it('should create empty blob', () => {
    const blob = base64ToBlob('');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(0);
  });

  it('should throw an error if the base64 string is invalid', () => {
    expect(() => base64ToBlob('-10')).toThrow();
  });
});
