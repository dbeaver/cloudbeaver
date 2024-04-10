/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getSelectedText } from './getSelectedText';

describe('getSelectedText', () => {
  const mockGetSelection = jest.fn();
  const originalGetSelection = global.window.getSelection;

  beforeAll(() => {
    global.window.getSelection = mockGetSelection;
  });

  afterEach(() => {
    mockGetSelection.mockClear();
  });

  afterAll(() => {
    global.window.getSelection = originalGetSelection;
  });

  it('returns the selected text when text is selected', () => {
    mockGetSelection.mockReturnValue({
      toString: () => 'Selected text',
    });

    const selectedText = getSelectedText();
    expect(selectedText).toBe('Selected text');
    expect(mockGetSelection).toHaveBeenCalled();
  });

  it('returns an empty string when no text is selected', () => {
    mockGetSelection.mockReturnValue({
      toString: () => '',
    });

    const selectedText = getSelectedText();
    expect(selectedText).toBe('');
    expect(mockGetSelection).toHaveBeenCalled();
  });

  it('handles environments where window.getSelection is not supported', () => {
    delete (global.window as any).getSelection;

    const selectedText = getSelectedText();
    expect(selectedText).toBe(undefined);
  });
});
