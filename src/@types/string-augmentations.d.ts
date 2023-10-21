interface String {
  capitalized<T extends string>(this: T): Capitalize<T>;
  toUpperCase<T extends string>(this: T): Uppercase<T>;
  toLocaleUpperCase<T extends string>(this: T): Uppercase<T>;
  toLowerCase<T extends string>(this: T): Lowercase<T>;
  toLocaleLowerCase<T extends string>(this: T): Lowercase<T>;
}
