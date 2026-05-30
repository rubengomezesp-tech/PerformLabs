import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  Dumbbell,
  HeartPulse,
  LineChart,
  Mail,
  MessageSquare,
  Palette,
  Sparkles,
  Utensils,
} from "lucide-react";
import { submitLeadAction } from "@/app/lead-actions";
import { LandingNav } from "@/components/landing/landing-nav";
import { PhoneBuild } from "@/components/landing/phone-build";
import { ScreensGallery } from "@/components/landing/screens-gallery";
import { MotionReveal, SmoothScroll } from "@/components/motion-reveal";
import { platformBrand } from "@/lib/brand";
import { getI18n } from "@/lib/i18n/server";

const capabilityIcons = [Camera, Dumbbell, LineChart, Utensils, HeartPulse, Palette];

export default async function Home() {
  const { locale, dict } = await getI18n();

  const navItems = [
    { label: dict.nav.app, href: "#plataforma" },
    { label: dict.nav.process, href: "#proceso" },
    { label: dict.nav.demo, href: "#demo" },
  ];

  return (
    <main className="landing landingV2">
      <SmoothScroll />
      <a className="stickyLeadCta" href="#consulta">
        {dict.hero.ctaPrimary} <ArrowRight size={16} />
      </a>
      <LandingNav
        brandName={platformBrand.name}
        markUrl={platformBrand.markUrl}
        items={navItems}
        locale={locale}
        ctaLabel={dict.nav.requestProposal}
        switcherLabel={dict.switcher.label}
        switcherChange={dict.switcher.change}
      />

      {/* ---- Hero ---- */}
      <section className="v2Hero">
        <div className="auroraField" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <MotionReveal className="v2HeroInner">
          <span className="v2Eyebrow"><Sparkles size={13} /> {dict.hero.eyebrow}</span>
          <h1 className="v2Headline">
            {dict.hero.headlineLead}{" "}
            <span className="accentText">{dict.hero.accents[0]}</span>,{" "}
            <span className="accentText">{dict.hero.accents[1]}</span> {dict.hero.conjunction}{" "}
            <span className="accentText">{dict.hero.accents[2]}</span>{dict.hero.headlineTail}
          </h1>
          <p className="v2Sub">{dict.hero.sub}</p>
          <div className="v2Cta">
            <a className="btn primary lg" href="#consulta">
              {dict.hero.ctaPrimary} <span className="btnArrow"><ArrowRight size={18} /></span>
            </a>
            <Link className="btn lg ghost" href="/app">
              {dict.hero.ctaDemo} <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="v2Trust">
            {dict.trust.map((signal) => (
              <span key={signal}><CheckCircle2 size={15} /> {signal}</span>
            ))}
          </div>
        </MotionReveal>

        <MotionReveal className="v2Device" delay={0.12}>
          <PhoneBuild />
        </MotionReveal>
      </section>

      {/* ---- Stats ---- */}
      <section className="v2Section v2StatsSection">
        <MotionReveal className="v2Stats">
          {dict.stats.map((stat) => (
            <div className="v2Stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </MotionReveal>
      </section>

      {/* ---- Bento: what the app does ---- */}
      <section className="v2Section" id="plataforma">
        <div className="platformGlow" aria-hidden="true" />
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag">{dict.platform.tag}</span>
          <h2>{dict.platform.title}</h2>
          <p>{dict.platform.text}</p>
        </MotionReveal>

        <div className="bentoGrid">
          {dict.capabilities.map((cap, index) => {
            const Icon = capabilityIcons[index] ?? Camera;
            const featured = index === 0;
            return (
              <MotionReveal key={cap.title} className={featured ? "bentoCell bentoFeature" : "bentoCell"} delay={index * 0.04}>
                <span className="bentoIcon"><Icon size={featured ? 24 : 20} /></span>
                <div className="bentoBody">
                  <span className="bentoTag">{cap.tag}</span>
                  <h3>{cap.title}</h3>
                  <p>{cap.text}</p>
                </div>
                {featured ? (
                  <div className="bentoShot" aria-hidden="true">
                    <div className="bentoShotPhoto"><Camera size={20} /></div>
                    <div className="bentoShotResult">
                      <strong>{dict.bentoShot.dish}</strong>
                      <div className="bentoShotMacros">
                        <span><b>48</b>P</span><span><b>62</b>C</span><span><b>14</b>G</span><span className="kcal"><b>560</b>kcal</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </MotionReveal>
            );
          })}
        </div>
      </section>

      {/* ---- Proceso ---- */}
      <section className="v2Section" id="proceso">
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag">{dict.process.tag}</span>
          <h2>{dict.process.title}</h2>
          <p>{dict.process.text}</p>
        </MotionReveal>
        <div className="v2Steps">
          {dict.process.steps.map((step, index) => (
            <MotionReveal className="v2Step" key={step.title} delay={index * 0.06}>
              <span className="v2StepNum">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      {/* ---- Demo: swipeable screens ---- */}
      <section className="v2Section" id="demo">
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag">{dict.demo.tag}</span>
          <h2>{dict.demo.title}</h2>
          <p>{dict.demo.text}</p>
        </MotionReveal>
        <ScreensGallery />
      </section>

      {/* ---- Lead form ---- */}
      <section className="v2Section" id="consulta">
        <div className="v2FormGrid">
          <MotionReveal className="v2FormIntro">
            <span className="v2Tag"><Mail size={12} /> {dict.lead.tag}</span>
            <h2>{dict.lead.title}</h2>
            <p>{dict.lead.text}</p>
            <div className="v2Trust v2TrustStack">
              {dict.trust.map((signal) => (
                <span key={signal}><CheckCircle2 size={15} /> {signal}</span>
              ))}
            </div>
          </MotionReveal>
          <MotionReveal className="v2FormCard" delay={0.1}>
            <form action={submitLeadAction} className="leadForm">
              <label>{dict.lead.fields.name}<input name="fullName" placeholder={dict.lead.fields.namePlaceholder} required /></label>
              <label>{dict.lead.fields.email}<input name="email" placeholder="tu@email.com" required type="email" /></label>
              <label>{dict.lead.fields.phone}<input name="phone" placeholder="+34..." /></label>
              <label>{dict.lead.fields.brand}<input name="brandName" placeholder={dict.lead.fields.brandPlaceholder} /></label>
              <label>{dict.lead.fields.site}<input name="websiteUrl" placeholder="https://..." /></label>
              <label>
                {dict.lead.fields.clients}
                <select name="monthlyClients" defaultValue="">
                  <option value="" disabled>{dict.lead.fields.clientsPlaceholder}</option>
                  <option value="0-20">0-20</option>
                  <option value="21-100">21-100</option>
                  <option value="101-500">101-500</option>
                  <option value="500+">500+</option>
                </select>
              </label>
              <label className="spanFull">
                {dict.lead.fields.goal}
                <select name="mainGoal" defaultValue="">
                  <option value="" disabled>{dict.lead.fields.goalPlaceholder}</option>
                  <option value="launch">{dict.lead.fields.goalLaunch}</option>
                  <option value="upgrade">{dict.lead.fields.goalUpgrade}</option>
                  <option value="scale">{dict.lead.fields.goalScale}</option>
                  <option value="brand">{dict.lead.fields.goalBrand}</option>
                </select>
              </label>
              <label className="spanFull">
                {dict.lead.fields.notes}
                <textarea name="notes" placeholder={dict.lead.fields.notesPlaceholder} rows={4} />
              </label>
              <div className="spanFull formActions">
                <button className="btn primary lg" type="submit">
                  {dict.lead.fields.submit} <span className="btnArrow"><ArrowRight size={18} /></span>
                </button>
              </div>
            </form>
          </MotionReveal>
        </div>
      </section>

      {/* ---- FAQ ---- */}
      <section className="v2Section" id="faqs">
        <MotionReveal className="v2SectionHead">
          <span className="v2Tag"><MessageSquare size={12} /> {dict.faq.tag}</span>
          <h2>{dict.faq.title}</h2>
        </MotionReveal>
        <div className="v2Faq">
          {dict.faq.items.map((faq, index) => (
            <MotionReveal className="v2FaqItem" key={faq.question} delay={index * 0.05}>
              <strong>{faq.question}</strong>
              <p>{faq.answer}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="v2Footer">
        <div className="v2FooterTop">
          <div className="v2FooterBrand">
            <img src={platformBrand.markUrl} alt={platformBrand.name} />
            <span>{platformBrand.name}</span>
          </div>
          <nav className="v2FooterNav" aria-label={platformBrand.name}>
            <a href="#plataforma">{dict.nav.app}</a>
            <a href="#proceso">{dict.nav.process}</a>
            <a href="#demo">{dict.nav.demo}</a>
            <a href="#consulta">{dict.nav.requestProposal}</a>
          </nav>
        </div>
        <div className="v2FooterBottom">
          <span>© {new Date().getFullYear()} {platformBrand.name}. {dict.footer.tagline}</span>
          <a className="btn primary" href="#consulta">{dict.footer.start} <span className="btnArrow"><ArrowRight size={15} /></span></a>
        </div>
      </footer>
    </main>
  );
}
