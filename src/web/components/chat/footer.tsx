import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@web/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@web/components/ui/dialog';
import { Textarea } from '@web/components/ui/textarea';
import { uploadFile } from '@web/lib/messages';
import { cn } from '@web/lib/utils';
import { ArrowUp, Check, ChevronsUpDown, Paperclip, X } from 'lucide-react';
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { type ModelId, models } from '@server/utils/models';

export type AttachmentFile = {
  id: string;
  name: string;
  type: string;
  url?: string;
};

type ChatFooterProps = {
  onSubmit: (message: string) => void;
  updateModel: (model: ModelId) => Promise<unknown>;
  selectedModel?: ModelId;
  userId?: string;
  messageFiles?: AttachmentFile[];
  setMessageFiles?: Dispatch<SetStateAction<AttachmentFile[]>>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatFooter({
  onSubmit,
  selectedModel,
  updateModel,
  userId,
  messageFiles,
  setMessageFiles,
}: ChatFooterProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const model = models.find(m => m.id === selectedModel);

  const canAttachImage = (
    model?.architecture.input_modalities as readonly string[]
  )?.includes('image');
  const canAttachFile = (
    model?.architecture.input_modalities as readonly string[]
  )?.includes('file');
  const canAttach = canAttachImage || canAttachFile;

  let acceptTypes = '';
  if (canAttachImage && canAttachFile) {
    acceptTypes = 'image/*,.pdf';
  } else if (canAttachImage) {
    acceptTypes = 'image/*';
  } else if (canAttachFile) {
    acceptTypes = '.pdf';
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = new FormData(e.target as HTMLFormElement).get(
      'message',
    ) as string;
    if (!message.trim() && (!messageFiles || messageFiles.length === 0)) return;
    onSubmit(message);
    if (setMessageFiles && messageFiles && messageFiles.length > 0) {
      messageFiles.forEach(file => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });
      setMessageFiles([]);
    }
    formRef.current?.reset();
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!userId || !setMessageFiles) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size cannot exceed 10MB.');
        return;
      }
      const fileId = await uploadFile(file, userId);
      const newAttachment: AttachmentFile = {
        id: fileId,
        name: file.name,
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        newAttachment.url = URL.createObjectURL(file);
      }
      setMessageFiles(prev => [...(prev || []), newAttachment]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (!setMessageFiles || !messageFiles) return;

    const fileToRemove = messageFiles.find(f => f.id === fileId);
    if (fileToRemove?.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }
    setMessageFiles(files => files?.filter(f => f.id !== fileId) || []);
  };

  useEffect(() => {
    return () => {
      if (messageFiles) {
        messageFiles.forEach(file => {
          if (file.url) {
            URL.revokeObjectURL(file.url);
          }
        });
      }
    };
  }, []);

  return (
    <div className='mx-auto w-full max-w-3xl rounded-sm bg-white shadow-md'>
      <form className='p-4' ref={formRef} onSubmit={handleSubmit}>
        <div className='border-input focus-within:ring-ring relative flex w-full flex-col rounded-md border bg-transparent p-3 text-sm shadow-sm focus-within:ring-1 focus-within:outline-none'>
          {messageFiles && messageFiles.length > 0 && (
            <div className='mb-2 flex flex-wrap gap-2'>
              {messageFiles.map(file => (
                <div
                  key={file.id}
                  className='bg-secondary flex items-center gap-2 rounded-md p-1'
                >
                  {file.url ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className='h-8 w-8 rounded-md object-cover'
                    />
                  ) : (
                    <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-md'>
                      <Paperclip className='h-4 w-4' />
                    </div>
                  )}
                  <span className='max-w-[100px] truncate text-sm'>
                    {file.name}
                  </span>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='h-6 w-6 shrink-0 rounded-full'
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className='relative'>
            <Textarea
              name='message'
              placeholder='Type your message here...'
              className='field-size-content chat-scrollbar max-h-[175px] w-full resize-none border-none bg-transparent pr-16 shadow-none focus-visible:ring-0'
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <Button
              size='icon'
              className='absolute right-2 bottom-2'
              type='submit'
            >
              <ArrowUp className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className='w-[250px] justify-between'
                >
                  <span className='truncate'>
                    {selectedModel
                      ? models.find(m => m.id === selectedModel)?.name
                      : 'Select model...'}
                  </span>
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </DialogTrigger>
              <DialogContent className='p-0' showCloseButton={false}>
                <VisuallyHidden>
                  <DialogTitle>Model selection</DialogTitle>
                </VisuallyHidden>
                <VisuallyHidden>
                  <DialogDescription>
                    Select a model to chat with.
                  </DialogDescription>
                </VisuallyHidden>

                <Command>
                  <CommandInput placeholder='Search model...' />
                  <CommandList className='chat-scrollbar'>
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {models.map(m => (
                        <CommandItem
                          key={m.id}
                          value={m.id}
                          onSelect={currentValue => {
                            updateModel(currentValue as ModelId);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedModel === m.id
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {m.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </DialogContent>
            </Dialog>
            {canAttach && (
              <>
                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept={acceptTypes}
                  className='hidden'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className='h-4 w-4' />
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
