import { SQSEvent } from 'aws-lambda';

export const handler = (event: SQSEvent) => {
  console.log(event);
};
