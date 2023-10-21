/* eslint-disable class-methods-use-this */
import { Logger as ILogger, LogLevel } from '../types/Logger';

function executeIfNotSynth(fn: () => void) {
  if (process.env.CDK_SYNTH_MODE === 'true') return;
  fn();
}
class Logger implements ILogger {
  info(...data: any[]): void {
    executeIfNotSynth(() => {
      console.info(this.getLogArgs(LogLevel.INFO, ...data));
    });
  }

  debug(...data: any[]): void {
    executeIfNotSynth(() => {
      console.debug(this.getLogArgs(LogLevel.DEBUG, ...data));
    });
  }

  warn(...data: any[]): void {
    executeIfNotSynth(() => {
      console.warn(this.getLogArgs(LogLevel.WARN, ...data));
    });
  }

  error(...data: any[]): void {
    executeIfNotSynth(() => {
      console.error(this.getLogArgs(LogLevel.ERROR, ...data));
    });
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
