// @ts-ignore
String.prototype.capitalized = function capitalized<T extends string>(this: T) {
  const capitalizedString = this.charAt(0).toUpperCase() + this.slice(1) as Capitalize<T>;
  return capitalizedString;
};

export const capitalized = <T extends string>(str: T) => {
  const capitalizedString = str.charAt(0).toUpperCase() + str.slice(1) as Capitalize<T>;
  return capitalizedString;
};
