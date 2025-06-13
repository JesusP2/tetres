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
import { abortGeneration } from '@web/lib/messages';
import { cn } from '@web/lib/utils';
import {
  ArrowUp,
  Check,
  ChevronsUpDown,
  Paperclip,
  X,
  Square,
} from 'lucide-react';
import {
  useRef,
  useState,
} from 'react';
import { type ModelId, models } from '@server/utils/models';
import { MyUploadButton } from '../upload-button';
import type { Message } from '@web/lib/types';
import type { ClientUploadedFileData } from 'uploadthing/types';

type ChatFooterProps = {
  onSubmit: (message: string, files: ClientUploadedFileData<null>[]) => PromiseLike<void>;
  updateModel: (model: ModelId) => Promise<unknown>;
  selectedModel?: ModelId;
  userId?: string;
  lastMessage?: Message;
};

export function ChatFooter({
  onSubmit,
  selectedModel,
  updateModel,
  userId,
  lastMessage,
}: ChatFooterProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('');
  const [messageFiles, setMessageFiles] = useState<(ClientUploadedFileData<null> | string)[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const model = models.find(m => m.id === selectedModel);
  const isGenerating = lastMessage?.role === 'assistant' && !lastMessage.finished;

  const handleStop = async () => {
    if (lastMessage) {
      await abortGeneration(lastMessage.id);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() && (!messageFiles || messageFiles.length === 0)) return;
    await onSubmit(message, messageFiles);
    if (setMessageFiles && messageFiles && messageFiles.length > 0) {
      setMessageFiles([]);
    }
    setMessage('');
  };

  const handleRemoveFile = (fileId: string) => {
    if (!setMessageFiles || !messageFiles) return;

    const fileToRemove = messageFiles.find(f => f.id === fileId);
    setMessageFiles(files => files?.filter(f => f.id !== fileId) || []);
  };

  return (
    <div className='mx-auto w-full max-w-3xl rounded-sm bg-white shadow-md'>
      <form className='p-4' ref={formRef} onSubmit={handleSubmit}>
        <div className='border-input focus-within:ring-ring relative flex w-full flex-col rounded-md border bg-transparent p-3 text-sm shadow-sm focus-within:ring-1 focus-within:outline-none'>
          {messageFiles && messageFiles.length > 0 && (
            <div className='mb-2 flex flex-wrap gap-2'>
              {messageFiles.map(file => (
                <div
                  key={typeof file === 'string' ? file : file.ufsUrl}
                  className='bg-secondary flex items-center gap-2 rounded-md p-1'
                >
                  {
                    typeof file === 'string' ? <div>loading...</div>
                      : file.type.startsWith('image/') ? (
                        <img
                          src={file.ufsUrl}
                          alt={file.name}
                          className='h-8 w-8 rounded-md object-cover'
                        />
                      ) : (
                        <div className='bg-muted flex h-8 w-8 items-center justify-center rounded-md'>
                          <Paperclip className='h-4 w-4' />
                        </div>
                      )}
                  <span className='max-w-[100px] truncate text-sm'>
                    {typeof file === 'string' ? file : file.name}
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
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            {isGenerating ? (
              <Button
                size='icon'
                variant='destructive'
                className='absolute right-2 bottom-2'
                onClick={handleStop}
              >
                <Square className='h-4 w-4' />
              </Button>
            ) : (
              <Button
                size='icon'
                className='absolute right-2 bottom-2'
                type='submit'
                disabled={
                  !message.trim() && (!messageFiles || messageFiles.length === 0)
                }
              >
                <ArrowUp className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <ModelsButton selectedModel={selectedModel} updateModel={updateModel} />
            {canAttach && (
              <MyUploadButton
                disabled={isProcessing}
                onClientUploadComplete={files => {
                  const file = files[0];
                  if (!file) return;
                  setMessageFiles(prev => {
                    const files = prev.slice(0, prev.length - 1);
                    return [...files, file];
                  })
                }}
                onUploadBegin={() => setIsProcessing(true)}
                onBeforeUploadBegin={(files) => {
                  return files.map(file => {
                    setMessageFiles(prev => {
                      return [...prev, file.name];
                    })
                    return file;
                  });
                }}
                endpoint="uploader"
                acceptTypes={acceptTypes}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

export function ModelsButton({
  selectedModel,
  updateModel,
}: {
  selectedModel?: ModelId;
  updateModel: (model: ModelId) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
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
  )
}
