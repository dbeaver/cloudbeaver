export interface INodePackage {
  name: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  sideEffects?: string[];
  scripts?: Record<string, string>;
}
