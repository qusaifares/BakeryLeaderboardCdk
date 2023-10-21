import { Environment } from '../types/enum/Environment';

const DEFAULT_ENV: Environment = Environment.DEVELOPMENT;

export const ENV = Environment[(process.env.NODE_ENV || 'DEVELOPMENT').toUpperCase() as keyof typeof Environment] || DEFAULT_ENV;

console.log(`Current environment: ${process.env.NODE_ENV}, ${ENV}`);

export const isProduction = ENV === Environment.PRODUCTION;

export const isDevelopment = ENV === Environment.DEVELOPMENT;

export const isTest = ENV === Environment.TEST;
