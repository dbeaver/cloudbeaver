const fs = require('fs');
const { resolve } = require('path');
const { getCloudBeaverDeps } = require('../utils/getCloudBeaverDeps');

function getServiceWorkerSource() {
  return require.resolve('@cloudbeaver/core-browser/src/service-worker.ts');
}

function withTimestamp(version) {
  return `${version}.${new Date().toISOString().substr(0, 19).replace('T', '').split(/[-:]+/).join('').slice(0, -2)}`;
}

function scanCloudbeaverDeps(package) {
  const deps = new Set();
  const list = [package.name];

  while (list.length) {
    const dependency = list.shift();

    if (!deps.has(dependency)) {
      list.push(...getCloudBeaverDeps(require(resolve('../../node_modules', dependency, 'package.json'))));
    }

    deps.add(dependency);
  }

  return Array.from(deps.keys());
}

function getAssets(package, to) {
  const patterns = scanCloudbeaverDeps(package)
    .reverse()
    .map((dependency, index) => ({ from: resolve('../../node_modules', dependency, 'public'), to, force: true, priority: index }));

  return patterns.filter(pattern => fs.existsSync(pattern.from));
}

module.exports = {
  getServiceWorkerSource,
  withTimestamp,
  getAssets,
};
