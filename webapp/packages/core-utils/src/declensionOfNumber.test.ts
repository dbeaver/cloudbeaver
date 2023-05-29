/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { declensionOfNumber } from './declensionOfNumber';

describe('Declension of number', () => {
  test('should return "Год" when "1" is passed', () => {
    expect(declensionOfNumber(1, ['Год', 'Года', 'Лет'])).toBe('Год');
  });

  test('should return "Года" when "2" is passed', () => {
    expect(declensionOfNumber(2, ['Год', 'Года', 'Лет'])).toBe('Года');
  });

  test('should return "Лет" when "18" is passed', () => {
    expect(declensionOfNumber(18, ['Год', 'Года', 'Лет'])).toBe('Лет');
  });
});
