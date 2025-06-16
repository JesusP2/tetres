import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { useUser } from '@web/hooks/use-user';
import { createProject } from '@web/lib/projects';
import { db } from '@web/lib/instant';
import { FolderPlus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProjectButton() {
  const user = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!user.data || !projectName.trim()) return;

    setIsCreating(true);
    try {
      const projectId = crypto.randomUUID();
      const projectTx = createProject(user.data, projectName.trim(), projectId);
      await db.transact(projectTx);
      
      toast.success('Project created successfully!');
      setDialogOpen(false);
      setProjectName('');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCreateProject();
    } else if (e.key === 'Escape') {
      setDialogOpen(false);
      setProjectName('');
    }
  };

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} variant="outline" className="w-full">
        <FolderPlus className="mr-2 h-4 w-4" />
        New Project
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Projects help you organize your chats by topic or purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject} 
              disabled={!projectName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}