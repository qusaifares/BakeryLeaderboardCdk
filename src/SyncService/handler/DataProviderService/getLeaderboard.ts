import { APIGatewayProxyHandler } from 'aws-lambda';
import { LeaderboardResponse } from './api/models';
import { getLeaderboardResponse } from './manager/LeaderboardManager';

export interface GetLeaderboardRequest {
}

export interface GetLeaderboardResponse {
  players: LeaderboardResponse[];
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log('Received event:', event);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(await getLeaderboardResponse()),
  };
};
