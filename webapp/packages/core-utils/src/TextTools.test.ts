/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { TextTools } from './TextTools.js';

const TEXT_WIDTH = 100;
const LETTER_SPACING = 0.4;

function getLength(value: string): number {
  return TEXT_WIDTH + (value.length - 1) * LETTER_SPACING;
}

describe('TextTools', () => {
  let mockContext: jest.Mocked<CanvasRenderingContext2D>;

  beforeEach(() => {
    mockContext = {
      measureText: jest.fn().mockReturnValue({ width: TEXT_WIDTH }),
      font: '',
    } as unknown as jest.Mocked<CanvasRenderingContext2D>;

    const mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockContext),
    };

    jest.spyOn(document, 'createElement').mockImplementation(() => mockCanvas as unknown as HTMLCanvasElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getWidth', () => {
    it('should calculate width without container', () => {
      const options = {
        font: 'bold 16px Arial',
        text: ['Hello', 'World'],
      };

      const result = TextTools.getWidth(options);

      expect(mockContext.font).toBe('bold 16px Arial');
      expect(result).toEqual(options.text.map(getLength));
      expect(mockContext.measureText).toHaveBeenCalledTimes(options.text.length);
    });

    it('should use container styles when provided', () => {
      const mockContainer = document.createElement('div');
      const mockStyles = {
        getPropertyValue: jest.fn().mockReturnValueOnce('bold').mockReturnValueOnce('16px').mockReturnValueOnce('Arial, sans'),
      };

      jest.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyles as unknown as CSSStyleDeclaration);

      const options = {
        font: 'default',
        container: mockContainer,
        text: ['Test'],
      };

      const result = TextTools.getWidth(options);

      expect(mockContext.font).toBe('bold 16px Arial');
      expect(result).toEqual(options.text.map(getLength));
    });

    it('should use provided font when container styles are incomplete', () => {
      const mockContainer = document.createElement('div');
      const mockStyles = {
        getPropertyValue: jest.fn().mockReturnValue(''),
      };

      jest.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyles as unknown as CSSStyleDeclaration);

      const options = {
        font: 'italic 14px Times',
        container: mockContainer,
        text: ['Test'],
      };

      const result = TextTools.getWidth(options);

      expect(mockContext.font).toBe('italic 14px Times');
      expect(result).toEqual(options.text.map(getLength));
    });

    it('should handle empty text array', () => {
      const options = {
        font: 'bold 16px Arial',
        text: [],
      };

      const result = TextTools.getWidth(options);

      expect(result).toEqual([]);
      expect(mockContext.measureText).not.toHaveBeenCalled();
    });

    it('should handle single-character strings', () => {
      const options = {
        font: 'bold 16px Arial',
        text: ['A', 'B'],
      };

      const result = TextTools.getWidth(options);

      expect(result).toEqual(options.text.map(getLength));
      expect(mockContext.measureText).toHaveBeenCalledTimes(options.text.length);
    });
  });
});
