import 'dotenv/config';
import { SQSEvent } from 'aws-lambda';
import { FetchMatchRequestMessage } from '../../shared/types/message/FetchMatchRequestMessage';
import { config } from '../../shared/config/Config';
import { MatchSourceStepFunctionEvent } from '../../shared/types/message/MatchSourceStepFunctionEvent';

export const handler = (event: SQSEvent) => {
  const { STATE_MACHINE_ARN } = process.env;
  const stepFunctions = config.getAwsConfig().getStepFunctions();

  if (!STATE_MACHINE_ARN) {
    console.log('STATE_MACHINE_ARN was not passed in for event: ', event);
    return;
  }

  const records = event.Records;

  const messages: FetchMatchRequestMessage[] = records
    .map((record) => JSON.parse(record.body));

  // Change to messages.map(...) if either interface changes
  const inputs: MatchSourceStepFunctionEvent[] = messages;

  inputs.forEach(async (input) => {
    await stepFunctions.startExecution({
      stateMachineArn: STATE_MACHINE_ARN,
      input: JSON.stringify(input),
    });
  });
};
