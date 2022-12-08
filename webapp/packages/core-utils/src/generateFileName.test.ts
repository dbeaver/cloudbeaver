/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { generateFileName } from './generateFileName';

describe('generateFileName', () => {
  it('should generate a file name with the current date and time', () => {
    const fileName = 'my-file';
    const fileFormat = '.txt';

    const newFileName = generateFileName(fileName, fileFormat);

    // assert that the file name contains the provided file name and file format
    expect(newFileName).toContain(fileName);
    expect(newFileName).toContain(fileFormat);

    // assert that the file name contains the current date and time
    // in the correct format
    const now = new Date();
    const dateString = now.toISOString().slice(0, 10);
    const timeString = ('0' + now.getHours()).slice(-2) + '-' + ('0' + now.getMinutes()).slice(-2) + '-' + ('0' + now.getSeconds()).slice(-2);
    expect(newFileName).toContain(dateString);
    expect(newFileName).toContain(timeString);
  });
});