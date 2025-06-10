import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@web/components/ui/dialog';
import { createContext, type ReactNode, useContext, useState } from 'react';
import { Button } from '../ui/button';

type ConfirmFnProps = {
  title: ReactNode;
  description: ReactNode;
  handleConfirm: () => void;
  handleCancel?: () => void;
};

type ConfirmDialogProviderState = {
  confirmDelete: (config: ConfirmFnProps) => void;
};

const ConfirmDialogContext = createContext<ConfirmDialogProviderState>({
  confirmDelete: (config: ConfirmFnProps) => null,
});

export const useConfirmDialog = () => useContext(ConfirmDialogContext);
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ConfirmFnProps & { isOpen: boolean }>({
    isOpen: false,
    title: '',
    description: '',
    handleConfirm: () => null,
    handleCancel: () => null,
  });

  function confirmDelete({ title, description, handleConfirm, handleCancel }: ConfirmFnProps) {
    setConfig({
      isOpen: true,
      title,
      description,
      handleConfirm,
      handleCancel,
    });
  }

  return <>
    <ConfirmDialogContext.Provider value={{ confirmDelete }}>
      {children}
      <Dialog open={config.isOpen} onOpenChange={(open) => !open && setConfig({ ...config, isOpen: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
            <DialogDescription>{config.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              config.handleCancel?.();
              setConfig({ ...config, isOpen: false });
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              config.handleConfirm();
              setConfig({ ...config, isOpen: false });
            }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  </>;
}
