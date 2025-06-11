import { Button } from '@web/components/ui/button';
import { Paperclip, ArrowUp, Check, ChevronsUpDown } from 'lucide-react';
import {
  type Dispatch,
  type SetStateAction,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { type ModelId, models } from '@server/utils/models';
import type { Chat } from '@web/lib/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@web/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@web/components/ui/command';
import { cn } from '@web/lib/utils';
import { Textarea } from '@web/components/ui/textarea';
import { toast } from 'sonner';

type ChatFooterProps = {
  onSubmit: (message: string) => void;
  selectedModel: ModelId;
  setSelectedModel: Dispatch<SetStateAction<ModelId>>;
  chat?: Chat;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatFooter({
  onSubmit,
  selectedModel,
  setSelectedModel,
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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size cannot exceed 10MB.');
        return;
      }
      // TODO: Implement file upload logic using instantdb storage
      toast.info(`Selected file: ${file.name}. Upload logic not implemented.`);
    }
  };

  return (
    <div className="mx-auto max-w-3xl w-full bg-white shadow-md rounded-sm">
      <form className="p-4" ref={formRef} onSubmit={handleSubmit}>
        <div className="relative">
          <Textarea
            name="message"
            placeholder="Type your message here..."
            className="pr-16 field-size-content max-h-[175px] chat-scrollbar"
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2"
            type="submit"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[250px] justify-between"
                >
                  <span className="truncate">
                    {selectedModel
                      ? models.find(m => m.id === selectedModel)?.name
                      : 'Select model...'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0">
                <Command>
                  <CommandInput placeholder="Search model..." />
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
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept={acceptTypes}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
