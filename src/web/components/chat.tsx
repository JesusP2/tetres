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

export function Chat() {
  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow p-4'>
        {/* Chat messages will go here */}
        <div className='flex h-full items-center justify-center text-muted-foreground'>
          Select a model and start chatting
        </div>
      </div>
      <div className='p-4'>
        <div className='mx-auto max-w-2xl'>
          <div className='relative'>
            <Textarea
              placeholder='Type your message here...'
              className='pr-16'
              rows={2}
            />
            <Button size='icon' className='absolute right-2 bottom-2'>
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
      </div>
    </div>
  );
} 