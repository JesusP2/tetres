import { UploadButton, useUploadThing } from '@web/lib/uploadthing';
import { PaperclipIcon } from 'lucide-react';
import { buttonVariants } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function MyUploadButton(
  props: {
    acceptTypes: string;
  } & Parameters<typeof UploadButton>[0],
) {
  const { startUpload } = useUploadThing(props.endpoint, props);
  return (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <label data-ut-element='button' className={buttonVariants({ variant: 'outline' })}>
            <input
              className='hidden'
              type='file'
              accept={props.acceptTypes}
              onChange={async e => {
                e.preventDefault();
                const file = e.target.files?.item(0);
                if (!file) return;
                await startUpload([file]);
                e.target.value = '';
              }}
            />
            <PaperclipIcon size={16} />
            Attach
          </label>
        </TooltipTrigger>
        <TooltipContent>
          Add an attachment
          <div>
            Accepts: Text, PNG, JPEG, GIF, WebP, HEIC, PDF
          </div>
        </TooltipContent>
      </Tooltip>
      <div data-ut-element='allowed-content' className='sr-only'>
        {props.acceptTypes}
      </div>
    </div>
  );
}
