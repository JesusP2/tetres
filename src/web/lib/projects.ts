import { db } from '@web/lib/instant';
import type { Project } from './types';

export function createProject(
  user: { id: string },
  name: string,
  projectId: string,
) {
  return db.tx.projects[projectId]
    .update({
      name,
      pinned: false,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .link({ user: user.id });
}

export function updateProject(project: Project, updates: Partial<Pick<Project, 'name' | 'pinned'>>) {
  return db.transact(
    db.tx.projects[project.id].update({
      ...updates,
      updatedAt: new Date().toISOString(),
    }),
  );
}

export function updateProjectName(project: Project, name: string) {
  return updateProject(project, { name });
}

export function toggleProjectPin(project: Project) {
  return updateProject(project, { pinned: !project.pinned });
}

export function deleteProject(project: Project) {
  return db.transact(db.tx.projects[project.id].delete());
}