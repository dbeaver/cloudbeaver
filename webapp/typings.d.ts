/* eslint-disable */
/// <reference path="./node_modules/reshadow/elements.d.ts" />

declare module '*.scss?raw' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.json5' {
  const json: any
  export default json
}

declare module '*.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.css?raw' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module 'reshadow' {
  import { createElement, Component } from 'react'

  type StylesMap = { [key: string]: any }

  type IdFunction = <A extends JSX.Element>(node: A) => A

  declare function taggedStyled(
    strs: TemplateStringsArray,
    ...values: any[]
  ): IdFunction
  declare function taggedStyled<A extends JSX.Element>(node: A): A

  declare function styled(...styles: StylesMap[]): typeof taggedStyled
  declare function styled(
    strs: TemplateStringsArray,
    ...values: any[]
  ): IdFunction

  export declare var use: ((value: StylesMap) => {}) & {
    [key: string]: typeof Component
  }

  export declare function css(
    strs: TemplateStringsArray,
    ...values: any[]
  ): StylesMap
  export declare function keyframes(
    strs: TemplateStringsArray,
    ...values: any[]
  ): string

  export declare function create(styles: StylesMap[]): StylesMap

  declare var jsx: typeof createElement

  export default styled
}
