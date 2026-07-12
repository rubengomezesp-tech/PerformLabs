import Link from "next/link";
import { platformBrand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n/config";
import { getLocale } from "@/lib/i18n/server";
import { getRequestBrandContext } from "@/lib/request-brand";

// Self-contained copy: these strings belong to the 404 surface only, so they
// live here instead of inflating the shared Dictionary contract. Mirrors the
// 7 supported locales.
const COPY: Record<Locale, { title: string; text: string; cta: string }> = {
  es: { title: "Esta página no existe.", text: "El enlace puede estar roto o la página se movió. Desde el inicio llegas a todo.", cta: "Volver al inicio" },
  en: { title: "This page doesn’t exist.", text: "The link may be broken or the page moved. Everything starts from home.", cta: "Back to home" },
  pt: { title: "Esta página não existe.", text: "O link pode estar quebrado ou a página foi movida. A partir do início chega a tudo.", cta: "Voltar ao início" },
  fr: { title: "Cette page n’existe pas.", text: "Le lien est peut-être rompu ou la page a été déplacée. Tout part de l’accueil.", cta: "Retour à l’accueil" },
  de: { title: "Diese Seite existiert nicht.", text: "Der Link ist möglicherweise defekt oder die Seite wurde verschoben. Von der Startseite aus erreichst du alles.", cta: "Zur Startseite" },
  it: { title: "Questa pagina non esiste.", text: "Il link potrebbe essere rotto o la pagina è stata spostata. Dalla home raggiungi tutto.", cta: "Torna alla home" },
  zh: { title: "页面不存在。", text: "链接可能已失效，或页面已移动。从首页可以找到一切。", cta: "返回首页" },
};

export default async function NotFound() {
  const [locale, context] = await Promise.all([getLocale(), getRequestBrandContext()]);
  const t = COPY[locale] ?? COPY.es;
  const brand = context.kind === "platform"
    ? { name: platformBrand.name, markUrl: platformBrand.markUrl }
    : context.kind === "tenant"
      ? { name: context.brand.appName || context.brand.name, markUrl: context.brand.logoUrl }
      : null;

  return (
    <main className="notFound">
      <div className="notFoundGlow" aria-hidden="true" />
      <div className="notFoundInner">
        <span className="notFoundCode">404</span>
        <h1 className="notFoundTitle">{t.title}</h1>
        <p className="notFoundText">{t.text}</p>
        {context.kind === "unknown-tenant" ? null : (
          <Link href="/" className="btn primary notFoundCta">{t.cta}</Link>
        )}
        {brand ? (
          <span className="notFoundBrand">
            {brand.markUrl ? <img src={brand.markUrl} alt="" width={18} height={18} /> : null}
            {brand.name}
          </span>
        ) : null}
      </div>
    </main>
  );
}
