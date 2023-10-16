import { Environment } from '../types/enum/Environment';

const DEFAULT_ENV: Environment = Environment.DEVELOPMENT;

export const ENV = Environment[process.env.NODE_ENV as keyof typeof Environment] || DEFAULT_ENV;

export const isProduction = ENV === Environment.PRODUCTION;

export const isDevelopment = ENV === Environment.DEVELOPMENT;
