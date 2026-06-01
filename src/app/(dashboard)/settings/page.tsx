import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getActivePairingCode,
  getLinkedPhones,
} from "@/features/phone-linking/services/pairing.service";
import { PairingCard } from "@/features/phone-linking/components/pairing-card";
import { LinkedPhonesList } from "@/features/phone-linking/components/linked-phones-list";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // El layout ya garantiza user, pero TS no lo sabe — !user es imposible aquí.
  if (!user) return null;

  const [pairing, phones] = await Promise.all([
    getActivePairingCode(user.id),
    getLinkedPhones(user.id),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecta WhatsApp para capturar ideas desde tu chat.
        </p>
      </header>

      <PairingCard
        initial={
          pairing ? { code: pairing.code, expiresAt: pairing.expires_at } : null
        }
      />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">Números enlazados</h2>
        <LinkedPhonesList phones={phones} />
      </div>
    </div>
  );
}
