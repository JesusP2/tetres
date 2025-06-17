import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@web/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@web/components/ui/dialog';
import { XIcon } from 'lucide-react';

interface ExpandableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
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
            className
          )}
          {...props}
        />
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 border-0 bg-transparent shadow-none',
          expandedClassName
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Image</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden>
          <DialogDescription>{alt}</DialogDescription>
        </VisuallyHidden>
        <div className="relative">
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 
