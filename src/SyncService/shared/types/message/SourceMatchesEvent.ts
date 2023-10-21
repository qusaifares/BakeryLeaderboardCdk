export type SourceMatchesEvent = SourceMatchesByIntervalRequest | SourceMatchesByStartDateRequest;

interface SourceMatchesByIntervalRequest {
  type: SourceMatchesEventType.INTERVAL;
  interval: {
    minutes?: number;
    hours?: number;
    days?: number;
  }
}

interface SourceMatchesByStartDateRequest {
  type: SourceMatchesEventType.START_DATE;
  startEpochMilli: number;
}

export enum SourceMatchesEventType {
  INTERVAL = 'INTERVAL',
  START_DATE = 'START_DATE',
}
