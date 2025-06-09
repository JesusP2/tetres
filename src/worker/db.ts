import { init } from '@instantdb/admin';
import schema, { AppSchema } from '../../instant.schema';

export function getDb(env: {
  INSTANT_ADMIN_TOKEN: string;
  VITE_INSTANT_APP_ID: string;
}) {
  return init({
    appId: env.VITE_INSTANT_APP_ID,
    adminToken: env.INSTANT_ADMIN_TOKEN,
    schema: schema as AppSchema,
  });
}
