export type SourceMatchesEvent = SourceMatchesByIntervalRequest | SourceMatchesByStartDateRequest;

interface SourceMatchesByIntervalRequest extends SourceMatchesEventBase {
  type: SourceMatchesEventType.INTERVAL;
  interval: {
    minutes?: number;
    hours?: number;
    days?: number;
  }
}

interface SourceMatchesByStartDateRequest extends SourceMatchesEventBase {
  type: SourceMatchesEventType.START_DATE;
  startEpochMilli: number;
}

interface SourceMatchesEventBase {
  summonerIds?: string[];
}

export enum SourceMatchesEventType {
  INTERVAL = 'INTERVAL',
  START_DATE = 'START_DATE',
}
