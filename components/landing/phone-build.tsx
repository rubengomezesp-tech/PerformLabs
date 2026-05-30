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
import { Bell, Camera, Check, Dumbbell, Flame, Home, LineChart, MessageSquare, Play, Send, Sparkles, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const frame: Variants = {
  hidden: { opacity: 0, scale: 0.86, rotateY: -22, y: 30 },
  show: { opacity: 1, scale: 1, rotateY: 0, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const chip: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  show: (i: number) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: 1.1 + i * 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

const screenVariants: Variants = {
  enter: { opacity: 0, x: 26, filter: "blur(6px)" },
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, x: -26, filter: "blur(6px)", transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function PanelScreen() {
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <div className="appHeader">
        <span className="appLogo">PL</span>
        <div><strong>Tu marca</strong><small>Panel</small></div>
        <span className="appBell"><Bell size={14} /></span>
      </div>
      <div className="appHeroCard">
        <div className="appRing"><span>72%</span></div>
        <div><strong>Mi Recorrido</strong><small>Semana 6 · vas en racha</small></div>
      </div>
      <div className="appHabits">
        <span className="appHabit done"><Flame size={13} /></span>
        <span className="appHabit done"><Dumbbell size={13} /></span>
        <span className="appHabit"><Utensils size={13} /></span>
        <span className="appHabit"><LineChart size={13} /></span>
      </div>
      <div className="appWorkoutCard">
        <span className="appPlay"><Play size={14} /></span>
        <div><strong>Entreno de hoy</strong><small>Empuje · 6 ejercicios</small></div>
      </div>
    </div>
  );
}

function ChatScreen() {
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <div className="appHeader">
        <span className="appLogo accent"><Sparkles size={15} /></span>
        <div><strong>Coach IA</strong><small>en la voz de tu coach</small></div>
      </div>
      <div className="appChat">
        <div className="appBubble in">¿Puedo cambiar el arroz por patata?</div>
        <div className="appBubble out">Claro 👍 Mismo gramaje de carbohidratos y lo dejas igual de bien.</div>
        <div className="appBubble in">¿Y si entreno por la noche?</div>
        <div className="appBubble out">Perfecto. Cena 1–2 h después y prioriza proteína.</div>
      </div>
      <div className="appComposer"><span>Pregunta lo que necesites…</span><i><Send size={13} /></i></div>
    </div>
  );
}

function NutriScreen() {
  return (
    <div className="appUI">
      <div className="appStatus"><span>9:41</span><span className="appStatusDots"><i /><i /><i /></span></div>
      <div className="appHeader">
        <span className="appLogo accent"><Camera size={15} /></span>
        <div><strong>Comida</strong><small>foto → macros</small></div>
      </div>
      <div className="appPhoto"><Camera size={26} /></div>
      <div className="appNutriCard">
        <div className="appNutriHead"><strong>Bowl de pollo y arroz</strong><span className="appDone"><Check size={12} /> Añadido</span></div>
        <div className="appMacros">
          <span><b>48</b>P</span><span><b>62</b>C</span><span><b>14</b>G</span><span className="kcal"><b>560</b>kcal</span>
        </div>
      </div>
    </div>
  );
}

const SCREENS = [<PanelScreen key="p" />, <ChatScreen key="c" />, <NutriScreen key="n" />];

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

  function move(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }
  function reset() { px.set(0.5); py.set(0.5); }

  const tiltStyle = reduce ? undefined : { rotateX, rotateY, transformPerspective: 1100 };

  return (
    <div className="phoneStage" ref={ref} onMouseMove={reduce ? undefined : move} onMouseLeave={reduce ? undefined : reset}>
      <motion.div className="phoneTiltWrap" style={tiltStyle}>
        <div className="phoneFloat">
          <motion.div className="phone3d" variants={frame} initial={reduce ? "show" : "hidden"} animate="show">
            <div className="phoneNotch" />
            <div className="phoneScreen">
              <div className="phoneScreens">
                <AnimatePresence mode="wait">
                  <motion.div key={index} className="phoneScreenSlide" variants={screenVariants} initial="enter" animate="center" exit="exit">
                    {SCREENS[index]}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="appNav">
                <span className={index === 0 ? "active" : ""}><Home size={16} /></span>
                <span><Dumbbell size={16} /></span>
                <span className={index === 2 ? "active" : ""}><Utensils size={16} /></span>
                <span><LineChart size={16} /></span>
                <span className={index === 1 ? "active" : ""}><MessageSquare size={16} /></span>
              </div>
              <div className="phoneDots">
                {SCREENS.map((_, i) => <span key={i} className={i === index ? "on" : ""} />)}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div className="floatChip chipBrain" variants={chip} custom={0} initial={reduce ? "show" : "hidden"} animate="show">
          <Sparkles size={13} /> Coach IA respondiendo
        </motion.div>
        <motion.div className="floatChip chipPlan" variants={chip} custom={1} initial={reduce ? "show" : "hidden"} animate="show">
          <Dumbbell size={13} /> Plan generado con IA
        </motion.div>
        <motion.div className="floatChip chipBell" variants={chip} custom={2} initial={reduce ? "show" : "hidden"} animate="show">
          <Bell size={13} /> Recordatorio enviado
        </motion.div>
      </motion.div>
    </div>
  );
}
