/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export function getCloudBeaverDeps(packageJson: any) {
  const resultMap = {
    dependencies: [] as string[],
    peerDependencies: [] as string[],
    devDependencies: [] as string[],
  };

  for (const dep of Object.keys(resultMap) as (keyof typeof resultMap)[]) {
    const deps = Object.keys(packageJson[dep] || {});

    for (const dependency of deps) {
      if (!resultMap[dep].includes(dependency) && /@cloudbeaver\/(.*?)/.test(dependency)) {
        resultMap[dep].push(dependency);
      }
    }
  }

  return resultMap;
}
