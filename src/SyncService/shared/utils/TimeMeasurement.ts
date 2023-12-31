export enum TimeUnit {
  MILLISECONDS = 1,
  SECONDS = 1000,
  MINUTES = 60000,
  HOURS = 3600000,
  DAYS = 86400000,
}

export class TimeMeasurement {
  constructor(private value: number, private unit: TimeUnit) {
  }

  public to(unit: TimeUnit): number {
    const multiplier = this.unit / unit;
    return this.value * multiplier;
  }

  public toMilliSeconds() {
    return this.to(TimeUnit.MILLISECONDS);
  }

  public toSeconds() {
    return this.to(TimeUnit.SECONDS);
  }

  public toMinutes() {
    return this.to(TimeUnit.MINUTES);
  }

  public toHours() {
    return this.to(TimeUnit.HOURS);
  }

  public toDays() {
    return this.to(TimeUnit.DAYS);
  }

  public plus(value: number, unit: TimeUnit) {
    const valueInSameUnit = new TimeMeasurement(value, unit).to(this.unit);

    return new TimeMeasurement(this.value + valueInSameUnit, this.unit);
  }

  public plusMilliseconds(value: number) {
    return this.plus(value, TimeUnit.MILLISECONDS);
  }

  public plusSeconds(value: number) {
    return this.plus(value, TimeUnit.SECONDS);
  }

  public plusMinutes(value: number) {
    return this.plus(value, TimeUnit.MINUTES);
  }

  public plusHours(value: number) {
    return this.plus(value, TimeUnit.HOURS);
  }

  public plusDays(value: number) {
    return this.plus(value, TimeUnit.DAYS);
  }

  public isEqual(measurement: TimeMeasurement) {
    return this.toMilliSeconds() === measurement.toMilliSeconds();
  }

  public isGreaterThan(measurement: TimeMeasurement) {
    return this.toMilliSeconds() > measurement.toMilliSeconds();
  }

  public isLessThan(measurement: TimeMeasurement) {
    return this.toMilliSeconds() < measurement.toMilliSeconds();
  }

  public static ofMilliSeconds(value: number) {
    return new this(value, TimeUnit.MILLISECONDS);
  }

  public static ofSeconds(value: number) {
    return new this(value, TimeUnit.SECONDS);
  }

  public static ofMinutes(value: number) {
    return new this(value, TimeUnit.MINUTES);
  }

  public static ofHours(value: number) {
    return new this(value, TimeUnit.HOURS);
  }

  public static ofDays(value: number) {
    return new this(value, TimeUnit.DAYS);
  }
}
