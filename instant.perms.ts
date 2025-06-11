// instant.perms.ts
import type { InstantRules } from '@instantdb/react';

const rules = {
  // Prevent creation of new attributes without explicit schema changes
  attrs: {
    allow: {
      $default: 'false',
    },
  },
  $files: {
    allow: {
      view: 'isOwner',
      update: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
    },
    bind: ['isOwner', "auth.id != null && data.path.startsWith(auth.id + '/')"],
  },
  users: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.id'],
    allow: {
      view: 'isOwner',
      create: 'false',
      delete: 'false',
      update:
        'isOwner && (newData.email == data.email) && (newData.emailVerified == data.emailVerified) && (newData.createdAt == data.createdAt)',
    },
  },
  accounts: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.userId'],
    allow: {
      view: 'isOwner',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  sessions: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.userId'],
    allow: {
      view: 'isOwner',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  verifications: {
    allow: {
      $default: 'false',
    },
  },
  passkeys: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.userId'],
    allow: {
      view: 'isOwner',
      create: 'false',
      delete: 'false',
      update: 'false',
    },
  },
  projects: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.userId'],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  chats: {
    bind: ['isOwner', 'auth.id != null && auth.id == data.userId'],
    allow: {
      view: 'isOwner',
      create: 'isOwner',
      delete: 'isOwner',
      update: 'isOwner',
    },
  },
  messages: {
    bind: ['isOwner', "auth.id != null && auth.id in data.ref('chat.userId')", 'isLoggedIn', 'auth.id != null'],
    allow: {
      view: 'isOwner',
      create: 'isLoggedIn',
      delete: 'isOwner',
      update: 'isOwner',
    },
  }
} satisfies InstantRules;

export default rules;
