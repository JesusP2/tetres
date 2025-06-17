import { i } from '@instantdb/react';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed().optional(),
      url: i.any().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    files: i.entity({
      name: i.string(),
      ufsUrl: i.string(),
      type: i.string(),
      key: i.string(),
      size: i.number(),
      fileHash: i.string(),
      chatId: i.string().indexed(),
    }),
    users: i.entity({
      name: i.string(),
      email: i.string().unique(),
      emailVerified: i.boolean().optional(),
      image: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    sessions: i.entity({
      expiresAt: i.date(),
      token: i.string().unique(),
      createdAt: i.date(),
      updatedAt: i.date(),
      ipAddress: i.string().optional(),
      userAgent: i.string().optional(),
      userId: i.string(),
    }),
    accounts: i.entity({
      accountId: i.string(),
      providerId: i.string(),
      userId: i.string().indexed(),
      accessToken: i.string().optional(),
      refreshToken: i.string().optional(),
      idToken: i.string().optional(),
      accessTokenExpiresAt: i.date().optional(),
      refreshTokenExpiresAt: i.date().optional(),
      scope: i.string().optional(),
      password: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    verifications: i.entity({
      identifier: i.string(),
      value: i.string(),
      expiresAt: i.date(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    passkeys: i.entity({
      name: i.string().optional(),
      publicKey: i.string(),
      userId: i.string().indexed(),
      credentialID: i.string(),
      counter: i.number(),
      deviceType: i.string(),
      backedUp: i.boolean(),
      transports: i.string().optional(),
      createdAt: i.date().optional(),
    }),
    projects: i.entity({
      name: i.string(),
      pinned: i.boolean(),
      userId: i.string().indexed(),
      updatedAt: i.date().indexed(),
      createdAt: i.date(),
    }),
    chats: i.entity({
      title: i.string(),
      pinned: i.boolean(),
      model: i.string(),
      projectId: i.string().indexed().optional(),
      userId: i.string().indexed().optional(),
      branchId: i.string().optional(),
      updatedAt: i.date().indexed(),
      createdAt: i.date(),
    }),
    messages: i.entity({
      role: i.string(),
      content: i.json(),
      reasoning: i.json().optional(),
      aborted: i.date().optional(),
      finished: i.date().optional(),
      tokens: i.number().optional(),
      time: i.number().optional(),
      model: i.string(),
      chatId: i.string().indexed(),
      userId: i.string().indexed().optional(),
      updatedAt: i.date().indexed(),
      createdAt: i.date(),
    }),
    ui: i.entity({
      // theme: i.string().optional(),
      defaultModel: i.string(),
      userId: i.string().indexed(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
  },
  links: {
    users$user: {
      forward: {
        on: 'users',
        has: 'one',
        label: '$user',
        onDelete: 'cascade',
      },
      reverse: { on: '$users', has: 'one', label: 'users' },
    },
    uiUser: {
      forward: {
        on: 'ui',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'one', label: 'ui' },
    },
    sessionsUser: {
      forward: {
        on: 'sessions',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'many', label: 'sessions' },
    },
    accountsUser: {
      forward: {
        on: 'accounts',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'many', label: 'accounts' },
    },
    passkeysUser: {
      forward: {
        on: 'passkeys',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'many', label: 'passkeys' },
    },
    projectsUser: {
      forward: {
        on: 'projects',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'many', label: 'projects' },
    },
    chatsProject: {
      forward: {
        on: 'chats',
        has: 'one',
        label: 'project',
        onDelete: 'cascade',
      },
      reverse: { on: 'projects', has: 'many', label: 'chats' },
    },
    chatsUser: {
      forward: {
        on: 'chats',
        has: 'one',
        label: 'user',
        onDelete: 'cascade',
      },
      reverse: { on: 'users', has: 'many', label: 'chats' },
    },
    messageFiles: {
      forward: {
        on: 'messages',
        has: 'many',
        label: 'files',
      },
      reverse: { on: 'files', has: 'many', label: 'message' },
    },
    messagesChat: {
      forward: {
        on: 'messages',
        has: 'one',
        label: 'chat',
        onDelete: 'cascade',
      },
      reverse: { on: 'chats', has: 'many', label: 'messages' },
    },
  },
});

type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
