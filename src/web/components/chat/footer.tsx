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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/components/ui/popover';
import { Textarea } from '@web/components/ui/textarea';
import { uploadFile } from '@web/lib/messages';
import { cn } from '@web/lib/utils';
import { ArrowUp, Check, ChevronsUpDown, Paperclip } from 'lucide-react';
import {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { type ModelId, models } from '@server/utils/models';

type ChatFooterProps = {
  onSubmit: (message: string) => void;
  selectedModel: ModelId;
  setSelectedModel: Dispatch<SetStateAction<ModelId>>;
  userId?: string;
  setMessageFiles?: Dispatch<SetStateAction<string[]>>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatFooter({
  onSubmit,
  selectedModel,
  setSelectedModel,
  userId,
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
    if (!message.trim()) return;
    onSubmit(message);
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
      setMessageFiles(prev => [...prev, fileId]);
    }
  };

  return (
    <div className='mx-auto w-full max-w-3xl rounded-sm bg-white shadow-md'>
      <form className='p-4' ref={formRef} onSubmit={handleSubmit}>
        <div className='relative'>
          <Textarea
            name='message'
            placeholder='Type your message here...'
            className='field-size-content chat-scrollbar max-h-[175px] pr-16'
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
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
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
              </PopoverTrigger>
              <PopoverContent className='w-[250px] p-0'>
                <Command>
                  <CommandInput placeholder='Search model...' />
                  <CommandList>
                    <CommandEmpty>No model found.</CommandEmpty>
                    <CommandGroup>
                      {models.map(m => (
                        <CommandItem
                          key={m.id}
                          value={m.id}
                          onSelect={currentValue => {
                            setSelectedModel(currentValue as ModelId);
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
              </PopoverContent>
            </Popover>
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
