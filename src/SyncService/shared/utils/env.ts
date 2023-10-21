import { logger } from '../../../util/Logger';
import { Environment } from '../types/enum/Environment';

const DEFAULT_ENV: Environment = Environment.DEVELOPMENT;

export const ENV = Environment[(process.env.NODE_ENV || 'DEVELOPMENT').toUpperCase() as keyof typeof Environment] || DEFAULT_ENV;

logger.info(`process.env.NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`Running as environment: ${ENV}`);

export const isProduction = ENV === Environment.PRODUCTION;

export const isDevelopment = ENV === Environment.DEVELOPMENT;

export const isTest = ENV === Environment.TEST;
