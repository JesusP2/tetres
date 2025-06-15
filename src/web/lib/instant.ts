import { init } from '@instantdb/react';
import schema from '../../../instant.schema';
console.log('instant id:', import.meta.env.VITE_INSTANT_APP_ID);
export const db = init({
  appId: import.meta.env.VITE_INSTANT_APP_ID,
  schema,
});
