### Steps to run

1. install ```yarn``` globaly
2. execute ```yarn``` in this folder
3. execute ```lerna bootstrap```
3. execute ```lerna run build --stream --scope=@cloudbeaver/product-default```
4. open ```packages/product-default/lib/index.html``` or run ```npx serve packages/product-default/lib```

## Build

```
lerna run build --stream --scope=@cloudbeaver/product-default
```

## Dev

```
lerna run dev --stream --scope=@cloudbeaver/product-default
```

## Build GQL SDK
```sh
lerna run gql:gen --stream
```

