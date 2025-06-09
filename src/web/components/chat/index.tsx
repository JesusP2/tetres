import { ChatFooter } from './footer';

type ChatProps = {
  onSubmit?: (message: string) => void;
};

export function Chat({ onSubmit }: ChatProps) {
  return (
    <div className='flex flex-col h-full'>
      <div className='flex-grow p-4'>
        {/* Chat messages will go here */}
        <div className='flex h-full items-center justify-center text-muted-foreground'>
          Select a model and start chatting
        </div>
      </div>
      <ChatFooter onSubmit={onSubmit} />
    </div>
  );
} 
