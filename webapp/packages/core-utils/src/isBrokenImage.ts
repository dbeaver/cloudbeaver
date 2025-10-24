/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isImageBroken(imageUrl: string): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => {
      resolve(false);
    };

    img.onerror = () => {
      resolve(true);
    };

    img.src = imageUrl;
  });
}
