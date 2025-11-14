export interface SuspenseResourceDef<T> {
  name: string;
  resolve(key: string): Promise<T>;
}
