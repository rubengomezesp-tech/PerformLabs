"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { Bell, Dumbbell, Flame, Home, LineChart, MessageSquare, Play, Sparkles, Utensils } from "lucide-react";
import { useRef } from "react";

const frame: Variants = {
  hidden: { opacity: 0, scale: 0.86, rotateY: -22, y: 30 },
  show: { opacity: 1, scale: 1, rotateY: 0, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.5 } },
};

const piece: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const chip: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  show: (i: number) => ({ opacity: 1, scale: 1, y: 0, transition: { delay: 1.1 + i * 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }),
};

export function PhoneBuild() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 120, damping: 16, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 120, damping: 16, mass: 0.5 });
  const rotateY = useTransform(sx, [0, 1], [-12, 12]);
  const rotateX = useTransform(sy, [0, 1], [10, -10]);

  function move(event: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  }
  function reset() {
    px.set(0.5);
    py.set(0.5);
  }

  const tiltStyle = reduce ? undefined : { rotateX, rotateY, transformPerspective: 1100 };

  return (
    <div className="phoneStage" ref={ref} onMouseMove={reduce ? undefined : move} onMouseLeave={reduce ? undefined : reset}>
      <motion.div className="phoneTiltWrap" style={tiltStyle}>
        <div className="phoneFloat">
          <motion.div className="phone3d" variants={frame} initial={reduce ? "show" : "hidden"} animate="show">
            <div className="phoneNotch" />
            <div className="phoneScreen">
              <motion.div className="appUI" variants={stack} initial={reduce ? "show" : "hidden"} animate="show">
                <motion.div className="appStatus" variants={piece}>
                  <span>9:41</span>
                  <span className="appStatusDots"><i /><i /><i /></span>
                </motion.div>

                <motion.div className="appHeader" variants={piece}>
                  <span className="appLogo">PL</span>
                  <div>
                    <strong>Tu marca</strong>
                    <small>Panel</small>
                  </div>
                  <span className="appBell"><Bell size={14} /></span>
                </motion.div>

                <motion.div className="appHeroCard" variants={piece}>
                  <div className="appRing"><span>72%</span></div>
                  <div>
                    <strong>Mi Recorrido</strong>
                    <small>Semana 6 · vas en racha</small>
                  </div>
                </motion.div>

                <motion.div className="appHabits" variants={piece}>
                  <span className="appHabit done"><Flame size={13} /></span>
                  <span className="appHabit done"><Dumbbell size={13} /></span>
                  <span className="appHabit"><Utensils size={13} /></span>
                  <span className="appHabit"><LineChart size={13} /></span>
                </motion.div>

                <motion.div className="appWorkoutCard" variants={piece}>
                  <span className="appPlay"><Play size={14} /></span>
                  <div>
                    <strong>Entreno de hoy</strong>
                    <small>Empuje · 6 ejercicios</small>
                  </div>
                </motion.div>

                <motion.div className="appNav" variants={piece}>
                  <span className="active"><Home size={16} /></span>
                  <span><Dumbbell size={16} /></span>
                  <span><Utensils size={16} /></span>
                  <span><LineChart size={16} /></span>
                  <span><MessageSquare size={16} /></span>
                </motion.div>
              </motion.div>
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
