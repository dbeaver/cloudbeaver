### Steps to run

1. install ```yarn``` globaly
2. execute ```yarn``` in this folder
3. execute ```yarn run bootstrap```
3. execute ```yarn run build```
4. open ```packages/dbeaver/dist/index.html``` or run ```npx serve packages/dbeaver/dist```

## Dev

```
lerna run dev --scope @dbeaver/dbeaver
```

## Build GQL SDK
```sh
lerna run gql:gen --scope @dbeaver/core
```

