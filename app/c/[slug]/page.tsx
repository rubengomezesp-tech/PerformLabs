import { notFound } from "next/navigation";
import { SalesPage } from "@/components/sales/sales-page";
import { listCoachPlans } from "@/lib/repositories/coach-plans";
import { getStripeAccount } from "@/lib/repositories/stripe-billing";
import { getWorkspaceBrand } from "@/lib/repositories/workspaces";
import { startMemberCheckoutAction } from "./checkout-action";

export const dynamic = "force-dynamic";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

const STATUS_NOTICE: Record<string, string> = {
  cancelled: "Has cancelado el pago. Cuando quieras, vuelve a intentarlo.",
  account_not_found: "Este coach todavía no puede cobrar. Vuelve a intentarlo más tarde.",
  charges_disabled: "Este coach todavía no puede cobrar. Vuelve a intentarlo más tarde.",
  plan_not_found: "Ese plan ya no está disponible.",
  plan_workspace_mismatch: "Ese plan no pertenece a este coach.",
  plan_missing_price: "Ese plan todavía no está listo para comprar.",
  stripe_not_configured: "Los pagos no están disponibles ahora mismo.",
  error: "No se pudo iniciar el pago. Inténtalo de nuevo.",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = await getWorkspaceBrand(slug);
  if (brand.id === ZERO_UUID) return { title: "Coach no encontrado" };
  return {
    title: `Planes · ${brand.name}`,
    description: brand.heroSubtext || `Suscríbete al coaching de ${brand.name}.`,
  };
}

export default async function CoachSalesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const { status } = await searchParams;

  const brand = await getWorkspaceBrand(slug);
  if (brand.id === ZERO_UUID) notFound();

  const [plans, account] = await Promise.all([listCoachPlans(brand.id), getStripeAccount(brand.id)]);
  const canCheckout = Boolean(account?.chargesEnabled);
  const notice = status ? STATUS_NOTICE[status] ?? null : null;

  return (
    <SalesPage
      brand={brand}
      slug={slug}
      plans={plans}
      canCheckout={canCheckout}
      checkoutAction={startMemberCheckoutAction}
      notice={notice}
    />
  );
}
