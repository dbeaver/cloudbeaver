# vscode-java-configs


## FAQ

### Typescript Server crashed 5 times
  - Open `.pnp.cjs` and replace `bestCandidate.apiPaths.length === 1` with `bestCandidate.apiPaths.length > 0`
