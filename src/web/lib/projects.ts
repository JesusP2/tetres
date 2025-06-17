import { id } from '@instantdb/core';
import { db } from '@web/lib/instant';
import type { Chat, Project } from './types';

export function createProject(user: { id: string }, name: string) {
  const projectId = id();
  return db.transact([
    db.tx.projects[projectId]
      .update({
        name,
        pinned: false,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .link({ user: user.id }),
  ]);
}

export function updateProjectName(project: Project, name: string) {
  return db.transact([
    db.tx.projects[project.id].update({
      name,
      updatedAt: new Date().toISOString(),
    }),
  ]);
}

export function toggleProjectPin(project: Project) {
  return db.transact([
    db.tx.projects[project.id].update({
      pinned: !project.pinned,
      updatedAt: new Date().toISOString(),
    }),
  ]);
}

export function deleteProject(project: Project) {
  return db.transact([
    db.tx.projects[project.id].delete(),
  ]);
}

export function assignChatToProject(chat: Chat, projectId: string) {
  return db.transact([
    db.tx.chats[chat.id].update({
      projectId,
      updatedAt: new Date().toISOString(),
    }),
  ]);
}

export function removeChatFromProject(chat: Chat) {
  return db.transact([
    db.tx.chats[chat.id].update({
      projectId: null,
      updatedAt: new Date().toISOString(),
    }),
  ]);
}
