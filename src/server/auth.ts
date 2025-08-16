import { account, users } from './config';
import { ID } from 'node-appwrite';

export async function createUserSession(email: string, password: string) {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return { success: true, session };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while signin",
    };
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  try {
    const user = await users.create(
      ID.unique(),
      email,
      undefined,
      password,
      name
    );
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating user",
    };
  }
}

export async function getCurrentUser(sessionId: string) {
  try {
    account.client.setSession(sessionId);
    const user = await account.get();
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while getting the user",
    };
  }
}

export async function deleteCurrentSession(sessionId: string) {
  try {
    account.client.setSession(sessionId);
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while signout",
    };
  }
}
