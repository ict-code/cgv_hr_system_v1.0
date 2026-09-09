import { fileURLToPath } from 'node:url';

// Different port from the WMS project's test suite (15498) so both can run
// on the same machine without colliding.
export const TEST_DB_PORT = 15499;
export const TEST_DB_NAME = 'egaps_test';
export const TEST_DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${TEST_DB_PORT}/${TEST_DB_NAME}`;
export const TEST_DB_DIR = fileURLToPath(new URL('../../.test-db-data', import.meta.url));

process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET ??= 'test-jwt-secret-do-not-use-in-production';
