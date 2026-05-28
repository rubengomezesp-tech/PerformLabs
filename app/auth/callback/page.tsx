import { ShieldCheck } from "lucide-react";
import { platformBrand } from "@/lib/brand";

export default function AuthCallbackPage() {
  return (
    <main className="authPage">
      <section className="authPanel">
        <img className="brandImageMark" src={platformBrand.markUrl} alt="" />
        <div>
          <span className="eyebrow">Acceso seguro</span>
          <h1>Activando tu sesión.</h1>
          <p>Estamos verificando la invitación y preparando tu entrada a la consola.</p>
        </div>
      </section>
      <section className="authAside">
        <ShieldCheck color="var(--gold)" />
        <h2>Un momento.</h2>
        <p>Cuando termine la validación entrarás directamente al panel correspondiente.</p>
      </section>
    </main>
  );
}
