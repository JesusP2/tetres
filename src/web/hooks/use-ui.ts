import { id } from '@instantdb/core';
import { db } from '@web/lib/instant';
import { useEffect, useState } from 'react';
import { defaultModel, type ModelId } from '@server/utils/models';
import { useUser } from './use-user';

export function useUI() {
  const user = useUser();
  const { data, isLoading } = db.useQuery(
    !user.isPending
      ? {
          ui: {
            $: {
              where: {
                userId: user.data?.id || '',
              },
            },
          },
        }
      : {},
  );
  const [ui, setUI] = useState<{
    id: string;
    defaultModel: ModelId;
  } | null>(null);
  useEffect(() => {
    if (!user.data) return;
    const ui = data?.ui?.[0];
    if (Array.isArray(data?.ui) && data?.ui.length === 0) {
      console.log('no ui found');
      const uiId = id();
      setUI({
        id: uiId,
        defaultModel,
      });
      db.transact(
        db.tx.ui[uiId]
          .update({
            userId: user.data.id,
            defaultModel,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .link({
            user: user.data.id,
          }),
      );
      return;
    }
    if (isLoading || !ui) return;
    setUI({
      id: ui.id,
      defaultModel: (ui.defaultModel as ModelId) || defaultModel,
    });
  }, [data, user.isPending, isLoading]);

  async function updateUI(newUI: Partial<{ defaultModel: ModelId }>) {
    if (user.isPending || !ui) return;
    setUI({
      id: ui.id,
      defaultModel: newUI.defaultModel ?? ui.defaultModel,
    });
    await db.transact(db.tx.ui[ui.id].update(newUI));
  }

  return {
    ui,
    updateUI,
  };
}
