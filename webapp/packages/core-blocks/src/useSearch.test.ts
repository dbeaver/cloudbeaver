/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { useSearch } from './useSearch.js';

interface TestItem {
  name: string;
  description: string;
  category: string;
}

const useFuzzySearchSpy = vi.fn();

const mockFuzzySearch = vi.fn();
let mockSearchResult: any = null;

vi.mock('./useFuzzySearch', () => ({
  useFuzzySearch: vi.fn((config: any) => {
    useFuzzySearchSpy(config);
    return {
      search: mockFuzzySearch,
      get searchResult() {
        return mockSearchResult;
      },
    };
  }),
}));

describe('useSearch', () => {
  const testData: TestItem[] = [
    { name: 'Apple', description: 'A red fruit', category: 'fruit' },
    { name: 'Apricot', description: 'A sweet fruit', category: 'fruit' },
    { name: 'Carrot', description: 'An orange vegetable', category: 'vegetable' },
    { name: 'Banana', description: 'A yellow fruit', category: 'fruit' },
    { name: 'Avocado', description: 'A green fruit', category: 'fruit' },
    { name: 'Pineapple', description: 'A tropical fruit', category: 'fruit' },
  ];

  beforeEach(() => {
    useFuzzySearchSpy.mockClear();
    mockFuzzySearch.mockClear();
    mockSearchResult = null;
  });

  describe('Initialization', () => {
    test('should initialize with correct default values and observed state', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name', 'description'],
        }),
      );

      expect(result.current.searchResult).toEqual([]);
    });

    test('should initialize fuzzy search when matchStrategy is fuzzy', () => {
      renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'fuzzy',
        }),
      );

      expect(useFuzzySearchSpy).toHaveBeenCalledWith({
        sourceProposals: testData,
        fields: ['name'],
      });
    });

    test('should use contains strategy by default', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
        }),
      );

      result.current.setSearch('app');
      expect(result.current.searchResult).toHaveLength(2);
      expect(result.current.searchResult.map(item => item.name)).toContain('Apple');
      expect(result.current.searchResult.map(item => item.name)).toContain('Pineapple');
    });
  });

  describe('Search Strategy: startsWith', () => {
    test('should filter items that start with search term', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'startsWith',
        }),
      );

      result.current.setSearch('Ap');
      expect(result.current.searchResult).toHaveLength(2);
      expect(result.current.searchResult.map(item => item.name)).toContain('Apple');
      expect(result.current.searchResult.map(item => item.name)).toContain('Apricot');
    });

    test('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'startsWith',
        }),
      );

      result.current.setSearch('ap');
      expect(result.current.searchResult).toHaveLength(2);
    });

    test('should not match items that do not start with search term', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'startsWith',
        }),
      );

      result.current.setSearch('na');
      expect(result.current.searchResult).toHaveLength(0);
    });
  });

  describe('Search Strategy: contains', () => {
    test('should filter items that contain search term', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('an');
      expect(result.current.searchResult).toHaveLength(1);
      expect(result.current.searchResult[0]!.name).toBe('Banana');
    });

    test('should search in multiple fields', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name', 'description'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('orange');
      expect(result.current.searchResult).toHaveLength(1);
      expect(result.current.searchResult[0]!.name).toBe('Carrot');
    });

    test('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['description'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('FRUIT');
      expect(result.current.searchResult.length).toBeGreaterThan(0);
    });
  });

  describe('Search Strategy: fuzzy', () => {
    test('should call fuzzy search on setSearch', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'fuzzy',
        }),
      );

      result.current.setSearch('aple');
      expect(mockFuzzySearch).toHaveBeenCalledWith('aple');
    });
  });

  describe('Predicate Function', () => {
    test('should filter results using custom predicate', () => {
      const predicate = (item: TestItem) => item.category === 'fruit';

      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
          predicate,
        }),
      );

      result.current.setSearch('a');
      const fruitItems = result.current.searchResult.filter(item => item.category === 'fruit');
      expect(fruitItems).toEqual(result.current.searchResult);
    });

    test('should exclude items when predicate returns false', () => {
      const predicate = () => false;

      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
          predicate,
        }),
      );

      result.current.setSearch('a');
      expect(result.current.searchResult).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty search string', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('');
      expect(result.current.searchResult).toEqual([]);
    });

    test('should handle empty source hints', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: [],
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('test');
      expect(result.current.searchResult).toEqual([]);
    });

    test('should exclude exact matches', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('Apple');
      expect(result.current.searchResult.map(item => item.name)).not.toContain('Apple');
    });

    test('should handle non-string field values', () => {
      const dataWithMixedTypes = [
        { name: 'Test', description: 'A test item', category: 'test' },
        { name: 123 as any, description: 'Number name', category: 'test' },
        { name: null as any, description: 'Null name', category: 'test' },
      ];

      const { result } = renderHook(() =>
        useSearch({
          sourceHints: dataWithMixedTypes,
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('tes');
      expect(result.current.searchResult).toHaveLength(1);
      expect(result.current.searchResult[0]!.name).toBe('Test');
    });

    test('should handle search term with different casing for exact match', () => {
      const { result } = renderHook(() =>
        useSearch({
          sourceHints: testData,
          searchFields: ['name'],
          matchStrategy: 'contains',
        }),
      );

      result.current.setSearch('apple');
      expect(result.current.searchResult.map(item => item.name.toLowerCase())).not.toContain('apple');
    });
  });
});
