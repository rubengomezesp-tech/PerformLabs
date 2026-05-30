"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { Bell, Camera, Check, Dumbbell, Home, LineChart, Play, TrendingUp, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const frame: Variants = {
  hidden: { opacity: 0, scale: 0.86, rotateY: -22, y: 30 },
  show: { opacity: 1, scale: 1, rotateY: 0, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const chip: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  show: (i: number) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: 1.1 + i * 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

const slide: Variants = {
  enter: { opacity: 0, x: 26, filter: "blur(6px)" },
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -26, filter: "blur(6px)", transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function Header({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="appHeader">
      <span className="appLogo accent">{icon}</span>
      <div><strong>{title}</strong><small>{sub}</small></div>
    </div>
  );
}

function EntrenoScreen() {
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <Header icon={<Dumbbell size={15} />} title="Press banca" sub="Día 12 · Empuje" />
      <div className="appExCard">
        <div className="appVideoThumb"><Play size={18} /><span className="appVideoTag">Vídeo</span></div>
        <div className="appExMeta">
          <span>4 series</span><span>8-10 reps</span><span>90s desc</span>
        </div>
      </div>
      <div className="appSets">
        <div className="appSet done"><span>Serie 1</span><b>10 × 80 kg</b><i><Check size={11} /></i></div>
        <div className="appSet done"><span>Serie 2</span><b>8 × 82 kg</b><i><Check size={11} /></i></div>
        <div className="appSet active"><span>Serie 3</span><b className="ph">— × — kg</b><i className="empty" /></div>
      </div>
    </div>
  );
}

function ComidaScreen() {
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <Header icon={<Camera size={15} />} title="Comida" sub="Calorías por foto" />
      <div className="appPhoto"><Camera size={24} /><span>Foto al plato</span></div>
      <div className="appNutriCard">
        <div className="appNutriHead"><strong>Bowl de pollo y arroz</strong><span className="appDone"><Check size={12} /> Añadido</span></div>
        <div className="appMacros">
          <span><b>48</b>P</span><span><b>62</b>C</span><span><b>14</b>G</span><span className="kcal"><b>560</b>kcal</span>
        </div>
      </div>
    </div>
  );
}

function ProgresoScreen() {
  const bars = [38, 52, 46, 64, 58, 72, 80];
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <Header icon={<LineChart size={15} />} title="Progreso" sub="Últimas semanas" />
      <div className="appProgCard">
        <div className="appProgStat"><strong>−4,2 kg</strong><span><TrendingUp size={12} /> este mes</span></div>
        <div className="appBars">{bars.map((h, i) => <span key={i} style={{ height: `${h}%` }} className={i === bars.length - 1 ? "on" : ""} />)}</div>
      </div>
      <div className="appProgRows">
        <div className="appProgRow"><span>Press banca</span><b>+12 kg</b></div>
        <div className="appProgRow"><span>Sentadilla</span><b>+18 kg</b></div>
      </div>
    </div>
  );
}

const SCREENS = [<EntrenoScreen key="e" />, <ComidaScreen key="c" />, <ProgresoScreen key="p" />];

export function PhoneBuild() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 120, damping: 16, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 120, damping: 16, mass: 0.5 });
  const rotateY = useTransform(sx, [0, 1], [-12, 12]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SCREENS.length), 3600);
    return () => clearInterval(id);
  }, [reduce]);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }
  function reset() { px.set(0.5); py.set(0.5); }

  const tiltStyle = reduce ? undefined : { rotateX, rotateY, transformPerspective: 1100 };

  return (
    <div className="phoneStage" ref={ref} onMouseMove={reduce ? undefined : onMove} onMouseLeave={reduce ? undefined : reset}>
      <motion.div className="phoneTiltWrap" style={tiltStyle}>
        <div className="phoneFloat">
          <motion.div className="phone3d" variants={frame} initial={reduce ? "show" : "hidden"} animate="show">
            <div className="phoneNotch" />
            <div className="phoneScreen">
              <div className="phoneScreens">
                <AnimatePresence mode="wait">
                  <motion.div key={index} className="phoneScreenSlide" variants={slide} initial="enter" animate="center" exit="exit">
                    {SCREENS[index]}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="appNav">
                <span><Home size={16} /></span>
                <span className={index === 0 ? "active" : ""}><Dumbbell size={16} /></span>
                <span className={index === 1 ? "active" : ""}><Utensils size={16} /></span>
                <span className={index === 2 ? "active" : ""}><LineChart size={16} /></span>
                <span><Bell size={16} /></span>
              </div>
              <div className="phoneDots">{SCREENS.map((_, i) => <span key={i} className={i === index ? "on" : ""} />)}</div>
            </div>
          </motion.div>
        </div>

        <motion.div className="floatChip chipBrain" variants={chip} custom={0} initial={reduce ? "show" : "hidden"} animate="show">
          <Camera size={13} /> Calorías por foto
        </motion.div>
        <motion.div className="floatChip chipPlan" variants={chip} custom={1} initial={reduce ? "show" : "hidden"} animate="show">
          <Play size={13} /> Entreno en vídeo
        </motion.div>
        <motion.div className="floatChip chipBell" variants={chip} custom={2} initial={reduce ? "show" : "hidden"} animate="show">
          <TrendingUp size={13} /> Progreso guardado
        </motion.div>
      </motion.div>
    </div>
  );
}
