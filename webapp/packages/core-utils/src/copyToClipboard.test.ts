/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterAll, beforeEach, describe, expect, it, vitest } from 'vitest';

import { copyToClipboard } from './copyToClipboard.js';

describe('copyToClipboard', () => {
  const originalExecCommand = document.execCommand;

  beforeEach(() => {
    document.execCommand = vitest.fn();
  });

  afterAll(() => {
    document.execCommand = originalExecCommand;
  });

  it('should copy text to clipboard', () => {
    const testData = 'test clipboard data';
    const execCommandMock = vitest.spyOn(document, 'execCommand').mockReturnValue(true);

    copyToClipboard(testData);

    expect(execCommandMock).toHaveBeenCalledWith('copy');
  });

  it('should create and remove a temporary textarea element', () => {
    const testData = 'test data';
    const appendChildSpy = vitest.spyOn(document.body, 'appendChild');
    const removeChildSpy = vitest.spyOn(document.body, 'removeChild');

    copyToClipboard(testData);

    expect(appendChildSpy).toHaveBeenCalledTimes(1);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);

    const firstCall = appendChildSpy.mock.calls[0];
    expect(firstCall).toBeDefined();

    const textarea = firstCall![0] as HTMLTextAreaElement;
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.value).toBe(testData);
  });

  it('should restore focus to the previously active element', () => {
    const testData = 'test data';
    const mockElement = document.createElement('input');
    const focusSpy = vitest.spyOn(mockElement, 'focus');

    document.body.appendChild(mockElement);
    mockElement.focus();

    copyToClipboard(testData);

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    document.body.removeChild(mockElement);
  });
});
