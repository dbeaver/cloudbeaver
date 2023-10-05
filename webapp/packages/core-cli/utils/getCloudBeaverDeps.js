/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

function getCloudBeaverDeps(package) {
  const resultMap = {
    'dependencies': [],
    'peerDependencies': [],
    'devDependencies': [],
  };

  for (const dep of Object.keys(resultMap)) {
    const deps = Object.keys(package[dep] || {});

    for (const dependency of deps) {
      if (!resultMap[dep].includes(dependency) && /@cloudbeaver\/(.*?)/.test(dependency)) {
        resultMap[dep].push(dependency);
      }
    }
  }

  return resultMap;
}

module.exports = {
  getCloudBeaverDeps,
};