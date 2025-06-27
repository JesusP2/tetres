import { init } from '@instantdb/react';
import schema from '../../../instant.schema';

console.log('init', import.meta.env.VITE_INSTANT_APP_ID);
export const db = init({
  appId: "10d0a1d7-99ba-4152-8cc0-acb549e7b132",
  schema,
});
