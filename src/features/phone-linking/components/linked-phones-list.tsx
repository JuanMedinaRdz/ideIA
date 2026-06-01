"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Smartphone, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/date";
import { unlinkPhoneAction } from "../services/pairing.actions";

interface LinkedPhone {
  id: string;
  phone_e164: string;
  label: string | null;
  created_at: string;
}

export function LinkedPhonesList({ phones }: { phones: LinkedPhone[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (phones.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          Aún no has enlazado ningún número.
        </p>
      </Card>
    );
  }

  function onUnlink(id: string) {
    startTransition(async () => {
      await unlinkPhoneAction(id);
      router.refresh();
    });
  }

  return (
    <Card className="divide-y divide-border">
      {phones.map((p) => (
        <div key={p.id} className="flex items-center gap-3 p-4">
          <Smartphone className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm text-foreground">{p.phone_e164}</p>
            <p className="text-[11px] text-muted-foreground">
              Vinculado {timeAgo(p.created_at)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onUnlink(p.id)}
            disabled={pending}
            aria-label="Desvincular"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      ))}
    </Card>
  );
}
