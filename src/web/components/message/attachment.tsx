import type { AttachmentFile } from "@web/lib/types";
import { memo } from "react";
import { ExpandableImage } from "../expandable-image";
import { Button } from "../ui/button";
import { FileTextIcon } from "lucide-react";

export const Attachment = memo(({ file }: { file: AttachmentFile }) => {
  return (
    <div className='mt-2 space-y-2'>
      {
        file.ufsUrl && (
          <div key={file.key}>
            {file.type.startsWith('image/') ? (
              <ExpandableImage
                src={file.ufsUrl}
                alt={file.name}
                className='max-w-xs rounded-lg'
              />
            ) : (
              <a
                href={file.ufsUrl}
                download={file.name}
                target='_blank'
                rel='noopener noreferrer'
              >
                <Button variant='outline' className='w-full justify-start'>
                  <FileTextIcon className='h-4 w-4' />
                  <span className='flex-1 truncate'> {file.name} </span>
                </Button>
              </a>
            )}
          </div>
        )
      }
    </div>
  )
});
Attachment.displayName = "Attachment";
