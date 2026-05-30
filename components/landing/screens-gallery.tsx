"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Camera, Check, Dumbbell, Heart, LineChart, MessageSquare, Play, TrendingUp, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function Entreno() {
  return (
    <div className="galScreen">
      <div className="galHead"><span className="galDot accent"><Dumbbell size={13} /></span><div><strong>Press banca</strong><small>Día 12 · Empuje</small></div></div>
      <div className="galExCard">
        <div className="galVideo"><Play size={15} /><i>Vídeo</i></div>
        <div className="galMeta"><span>4 series</span><span>8-10</span><span>90s</span></div>
      </div>
      <div className="galRow done"><span>Serie 1</span><b>10 × 80</b><i><Check size={10} /></i></div>
      <div className="galRow done"><span>Serie 2</span><b>8 × 82</b><i><Check size={10} /></i></div>
      <div className="galRow"><span>Serie 3</span><b className="ph">— × —</b><i className="empty" /></div>
    </div>
  );
}

function Comida() {
  return (
    <div className="galScreen">
      <div className="galHead"><span className="galDot accent"><Camera size={13} /></span><div><strong>Comida</strong><small>Calorías por foto</small></div></div>
      <div className="galPhoto"><Camera size={20} /><span>Foto al plato</span></div>
      <div className="galNutri">
        <div className="galNutriHead"><strong>Bowl de pollo y arroz</strong><span className="galOk"><Check size={11} /></span></div>
        <div className="galMacros"><span><b>48</b>P</span><span><b>62</b>C</span><span><b>14</b>G</span><span className="kcal"><b>560</b>kcal</span></div>
      </div>
    </div>
  );
}

function Progreso() {
  const bars = [40, 54, 48, 66, 60, 74, 82];
  return (
    <div className="galScreen">
      <div className="galHead"><span className="galDot accent"><LineChart size={13} /></span><div><strong>Progreso</strong><small>Últimas semanas</small></div></div>
      <div className="galProg">
        <div className="galProgTop"><strong>−4,2 kg</strong><span><TrendingUp size={11} /> este mes</span></div>
        <div className="galBars">{bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} className={i === bars.length - 1 ? "on" : ""} />)}</div>
      </div>
      <div className="galRow flat"><span>Press banca</span><b className="up">+12 kg</b></div>
      <div className="galRow flat"><span>Sentadilla</span><b className="up">+18 kg</b></div>
    </div>
  );
}

function Mensajes() {
  return (
    <div className="galScreen">
      <div className="galHead"><span className="galDot accent"><MessageSquare size={13} /></span><div><strong>Tu coach</strong><small>en directo contigo</small></div></div>
      <div className="galChat">
        <div className="galBubble in">¡Buen trabajo esta semana! Subimos 2 kg en banca 💪</div>
        <div className="galBubble out">Genial, ¿toco algo del cardio?</div>
        <div className="galBubble in">Déjalo igual. El viernes revisamos tu progreso.</div>
      </div>
    </div>
  );
}

function Comunidad() {
  return (
    <div className="galScreen">
      <div className="galHead"><span className="galDot accent"><Users size={13} /></span><div><strong>Comunidad</strong><small>de tu marca</small></div></div>
      <div className="galPost">
        <div className="galPostHead"><span className="galAvatar">AL</span><div><strong>Ana López</strong><small>hace 2 h</small></div></div>
        <p>Primera semana completa sin saltarme ningún entreno. ¡Vamos! 🔥</p>
        <span className="galLike"><Heart size={13} /> 24</span>
      </div>
    </div>
  );
}

const CARDS = [
  { key: "entreno", label: "Entreno", el: <Entreno /> },
  { key: "comida", label: "Comida", el: <Comida /> },
  { key: "progreso", label: "Progreso", el: <Progreso /> },
  { key: "mensajes", label: "Mensajes", el: <Mensajes /> },
  { key: "comunidad", label: "Comunidad", el: <Comunidad /> },
];

export function ScreensGallery() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);

  useEffect(() => {
    function measure() {
      const el = trackRef.current;
      if (!el) return;
      setDrag(Math.max(0, el.scrollWidth - el.offsetWidth));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="screensGallery">
      <motion.div
        ref={trackRef}
        className="galTrack"
        drag={reduce ? false : "x"}
        dragConstraints={{ left: -drag, right: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.25, timeConstant: 200, bounceStiffness: 320, bounceDamping: 40 }}
        whileTap={{ cursor: "grabbing" }}
      >
        {CARDS.map((c) => (
          <div className="galCard" key={c.key}>
            <div className="galPhoneMini">{c.el}</div>
            <span className="galLabel">{c.label}</span>
          </div>
        ))}
      </motion.div>
      <p className="galHint">Arrastra para ver la app por dentro</p>
    </div>
  );
}
