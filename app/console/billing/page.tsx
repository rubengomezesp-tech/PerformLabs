import { CreditCard, Plus } from "lucide-react";
import { Topbar } from "@/components/topbar";
import { listManagedPricingPlans, listManagedProducts } from "@/lib/repositories/billing-management";
import { listWorkspaceSummaries } from "@/lib/repositories/workspaces";
import { createPricingPlanAction, createProductAction } from "./actions";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams?: Promise<{ brand?: string }>;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;
  const { workspaces } = await listWorkspaceSummaries();
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === params?.brand) ?? workspaces[0];
  const [products, plans] = await Promise.all([
    listManagedProducts(selectedWorkspace?.id),
    listManagedPricingPlans(selectedWorkspace?.id),
  ]);

  return (
    <>
      <Topbar
        eyebrow="Pagos"
        title="Ofertas, productos y planes de acceso."
        text="Prepara productos, trials, precios y módulos incluidos antes de conectar checkout real."
      />
      <section className="grid">
        <article className="card span12">
          <form action="/console/billing" className="formGrid" method="get">
            <label>
              Marca
              <select name="brand" defaultValue={selectedWorkspace?.id}>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="formActions">
              <button className="btn" type="submit">Ver pagos</button>
            </div>
          </form>
        </article>

        {selectedWorkspace ? (
          <>
            <article className="card span6">
              <h2>Nuevo producto</h2>
              <form action={createProductAction} className="formStack">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label>
                  Nombre
                  <input name="name" placeholder="Transformación 12 semanas" required />
                </label>
                <label>
                  Descripción
                  <textarea name="description" rows={3} placeholder="Qué incluye, para quién es y resultado prometido." />
                </label>
                <label>
                  Módulos incluidos
                  <input name="includedModules" placeholder="entrenamiento, nutrición, soporte" />
                </label>
                <button className="btn primary" type="submit">Crear producto <Plus size={18} /></button>
              </form>
            </article>

            <article className="card span6">
              <h2>Nuevo plan</h2>
              <form action={createPricingPlanAction} className="billingPlanForm">
                <input name="workspaceId" type="hidden" value={selectedWorkspace.id} />
                <label className="spanFull">
                  Producto
                  <select name="productId" defaultValue="">
                    <option value="">Selecciona producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Nombre
                  <input name="name" placeholder="Mensual" required />
                </label>
                <label>
                  Precio
                  <input name="price" placeholder="79" />
                </label>
                <label>
                  Moneda
                  <input name="currency" defaultValue="eur" />
                </label>
                <label>
                  Intervalo
                  <select name="billingInterval" defaultValue="month">
                    <option value="month">Mensual</option>
                    <option value="year">Anual</option>
                    <option value="one_time">Pago único</option>
                  </select>
                </label>
                <label>
                  Trial días
                  <input name="trialDays" defaultValue="0" min="0" type="number" />
                </label>
                <button className="btn primary" type="submit">Crear plan <CreditCard size={18} /></button>
              </form>
            </article>
          </>
        ) : null}

        {products.map((product) => (
          <article className="card span4" key={product.id}>
            <CreditCard color="var(--gold)" />
            <h3>{product.name}</h3>
            <p>{product.description || "Oferta pendiente de describir."}</p>
            <div className="tagCloud">
              {product.includedModules.map((module) => (
                <span className="tag" key={module}>{module}</span>
              ))}
            </div>
            <span className="tag">{product.status}</span>
          </article>
        ))}

        <article className="card span12">
          <h2>Planes de precio</h2>
          {plans.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Intervalo</th>
                  <th scope="col">Trial</th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.name}</td>
                    <td>{formatPrice(plan.priceCents, plan.currency)}</td>
                    <td>{plan.billingInterval}</td>
                    <td>{plan.trialDays} días</td>
                    <td><span className="tag">{plan.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="inlineEmpty">
              <CreditCard color="var(--gold)" />
              <h3>Todavía no hay planes de precio.</h3>
              <p>Crea un producto y después define sus precios, trial y forma de cobro.</p>
            </div>
          )}
        </article>
      </section>
    </>
  );
}
