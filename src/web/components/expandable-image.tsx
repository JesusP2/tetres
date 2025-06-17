import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@web/components/ui/dialog';
import { cn } from '@web/lib/utils';
import { XIcon } from 'lucide-react';
import * as React from 'react';

interface ExpandableImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  expandedClassName?: string;
}

export function ExpandableImage({
  src,
  alt,
  className,
  expandedClassName,
  ...props
}: ExpandableImageProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <img
          src={src}
          alt={alt}
          className={cn(
            'cursor-pointer transition-opacity hover:opacity-80',
            className,
          )}
          {...props}
        />
      </DialogTrigger>
      <DialogContent
        className={cn(
          'h-auto max-h-[95vh] w-auto max-w-[95vw] border-0 bg-transparent p-0 shadow-none',
          expandedClassName,
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Image</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden>
          <DialogDescription>{alt}</DialogDescription>
        </VisuallyHidden>
        <div className='relative'>
          <img
            src={src}
            alt={alt}
            className='max-h-[95vh] max-w-full rounded-lg object-contain'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
