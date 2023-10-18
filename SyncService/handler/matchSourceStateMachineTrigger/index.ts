import 'reflect-metadata';
import 'dotenv/config';
import { SQSEvent } from 'aws-lambda';
import { FetchMatchRequestMessage } from '../../shared/types/message/FetchMatchRequestMessage';
import { config } from '../../shared/config/Config';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';

const stepFunctions = config.getAwsConfig().getStepFunctions();

export const handler = (event: SQSEvent) => {
  console.log('Received event:', event);
  const { STATE_MACHINE_ARN } = process.env;

  if (!STATE_MACHINE_ARN) {
    throw new Error(`STATE_MACHINE_ARN was not passed in for event: ${event}`);
  }

  const records = event.Records;

  const messages: FetchMatchRequestMessage[] = records
    .map((record) => JSON.parse(record.body));

  // Change to messages.map(...) if either interface changes
  const inputs: MatchSourceStepFunctionEvent[] = messages;

  console.log(`Executing step functions for ${inputs.length} invocations.`);

  inputs.forEach(async (input) => {
    await stepFunctions.startExecution({
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify(input),
    });
  });
};
