export interface DatabaseCredentials {
  host: string;
  username: string;
  password: string;
  port: number;
  dbname: string;
  engine: string;
  dbClusterIdentifier?: string;
}
