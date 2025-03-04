export type IGridReactiveValueSubscribe<TArgs extends any[]> = (onValueChange: () => void, ...args: TArgs) => () => void;

export interface IGridReactiveValue<T, TArgs extends any[]> {
  get(...args: TArgs): T;
  subscribe: IGridReactiveValueSubscribe<TArgs>;
}
