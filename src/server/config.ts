import env from '@/env';
import { Client, Account, Users } from 'node-appwrite';

const client = new Client();

client
  .setEndpoint(env.appwrite.endpoint)
  .setProject(env.appwrite.projectId)
  .setKey(env.appwrite.apikey);

export const account = new Account(client);
export const users = new Users(client);
export { client };