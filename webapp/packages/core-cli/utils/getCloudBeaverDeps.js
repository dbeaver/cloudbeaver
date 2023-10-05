/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

function getCloudBeaverDeps(package) {
  const deps = [...Object.keys(package.dependencies || {}), ...Object.keys(package.peerDependencies || {})];

  if (deps.length === 0) {
    return [];
  }

  return deps
    .filter(dependency => /@cloudbeaver\/(.*?)/.test(dependency));
}

module.exports = {
  getCloudBeaverDeps,
};