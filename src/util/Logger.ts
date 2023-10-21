/* eslint-disable class-methods-use-this */
import { Logger as ILogger, LogLevel } from '../types/Logger';

class Logger implements ILogger {
  info(...data: any[]): void {
    if (process.env.CDK_SYNTH_MODE === 'true') {
      return;
    }

    console.info(this.getLogArgs(LogLevel.INFO, ...data));
  }

  debug(...data: any[]): void {
    console.debug(this.getLogArgs(LogLevel.DEBUG, ...data));
  }

  warn(...data: any[]): void {
    console.warn(this.getLogArgs(LogLevel.WARN, ...data));
  }

  error(...data: any[]): void {
    console.error(this.getLogArgs(LogLevel.ERROR, ...data));
  }

  private getLogArgs(level: LogLevel, ...data: any[]): any[] {
    const dataCopy = [...data];
    if (typeof dataCopy[0] === 'string') {
      dataCopy[0] = `[${level}] ${dataCopy[0]}`;
    } else {
      data.unshift(`[${level}]`);
    }
    return dataCopy;
  }
}

export const logger: ILogger = new Logger();
