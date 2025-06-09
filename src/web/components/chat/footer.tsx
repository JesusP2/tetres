import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@web/components/ui/select';
import { Textarea } from '@web/components/ui/textarea';
import { Button } from '@web/components/ui/button';
import { Paperclip, ArrowUp } from 'lucide-react';
import { useRef } from 'react';

type ChatProps = {
  onSubmit?: (message: string) => void;
};

export function ChatFooter({ onSubmit }: ChatProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = new FormData(e.target as HTMLFormElement).get(
      "message",
    ) as string;
    if (!onSubmit || !message.trim()) return;
    onSubmit(message);
    formRef.current?.reset();
  };
  return (
    <form className='p-4' ref={formRef} onSubmit={handleSubmit}>
      <div className='mx-auto max-w-2xl'>
        <div className='relative'>
          <Textarea
            name='message'
            placeholder='Type your message here...'
            className='pr-16 field-size-content max-h-[175px] chat-scrollbar'
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
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
        <div className='flex items-center justify-between mt-2'>
          <div className='flex items-center gap-2'>
            <Select defaultValue='gemini'>
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Select a model' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='gemini'>Gemini 2.5 Flash</SelectItem>
                <SelectItem value='claude'>Claude 3 Sonnet</SelectItem>
                <SelectItem value='chatgpt'>ChatGPT 4</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='ghost' size='icon'>
              <Paperclip className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
