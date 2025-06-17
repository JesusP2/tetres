import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { shareChat } from '@web/lib/chats';
import type { Chat } from '@web/lib/types';
import { db } from '@web/lib/instant';
import { useUser } from '@web/hooks/use-user';

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  chat,
}: ShareDialogProps) {
  const user = useUser();
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{
    sharedChatId: string;
    shareToken: string;
    shareUrl: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (isSharing || !user.data) return;

    setIsSharing(true);
    try {
      const { data } = await db.queryOnce({
        messages: {
          files: {},
          $: {
            where: {
              chatId: chat.id,
            },
            order: {
              updatedAt: 'asc',
            },
          },
        },
      })
      const result = await shareChat(chat, user.data, data.messages);
      setShareResult(result);
      toast.success('Chat shared successfully!');
    } catch (error) {
      console.error('Failed to share chat:', error);
      toast.error('Failed to share chat');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareResult) return;

    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInNewTab = () => {
    if (!shareResult) return;
    window.open(shareResult.shareUrl, '_blank');
  };

  const handleClose = () => {
    setShareResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Chat
          </DialogTitle>
          <DialogDescription>
            {shareResult ?
              'Your chat has been shared! Anyone with this link can view and copy it.' :
              'Create a public link that allows others to view and copy your chat.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareResult ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <p><strong>What happens when you share:</strong></p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>A snapshot of your current conversation is made public</li>
                  <li>Others can view the entire conversation</li>
                  <li>Others can copy it to their own account to continue chatting</li>
                  <li>Your original chat remains private and editable</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleShare} disabled={isSharing}>
                  {isSharing ? 'Sharing...' : 'Share Chat'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <Input
                    value={shareResult.shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenInNewTab}
                    className="shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
