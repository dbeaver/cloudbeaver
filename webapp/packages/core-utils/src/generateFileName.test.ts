/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { generateFileName } from './generateFileName';

describe('generateFileName', () => {
  it('should generate a file name in the expected format', () => {
    const mockDate = new Date('2020-09-09T14:13:20');
    const spy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

    const fileName = 'my-file';
    const fileFormat = '.txt';
    const expectedFileName = `${fileName} 2020-09-09 14-13-20${fileFormat}`;

    // Test the generateFileName function
    expect(generateFileName(fileName, fileFormat)).toEqual(expectedFileName);

    spy.mockRestore();
  });
});
