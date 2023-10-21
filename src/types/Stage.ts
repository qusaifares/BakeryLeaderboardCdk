export enum Stage {
  PROD = 'prod',
  TEST = 'test',
}
function manipulateEnumValue(value: Stage) {
  return value.toUpperCase();
}

console.log(manipulateEnumValue(Stage.TEST)); // Outputs: RED
