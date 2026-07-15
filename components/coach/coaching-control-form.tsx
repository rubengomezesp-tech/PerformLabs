"use client";

import { useMemo, useState } from "react";
import { Calculator, LockKeyhole, Minus, Plus, Save, Send } from "lucide-react";
import { saveCoachAdjustmentAction } from "@/app/coach/members/[id]/control/actions";
import { SubmitButton } from "@/components/ui";
import { calculateNutritionTargets, type ActivityLevel, type Gender, type NutritionGoal } from "@/lib/domain/nutrition-engine";
import type { CoachingControlDictionary } from "@/lib/i18n/coaching-control";

export type CoachingControlDefaults = {
  goal: NutritionGoal;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  proteinPerKg: number;
  fatRatioPercent: number;
  mealsPerDay: number;
  calorieOffset: number;
  trainingDaysPerWeek: number;
  dailyStepsTarget: number;
  currentTrainingWeek: number;
  effectiveOn: string;
  nextReviewOn: string;
  rationale: string;
  memberMessage: string;
};

function numberFrom(value: string, fallback: number) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function CoachingControlForm({
  workspaceId,
  memberProfileId,
  defaults,
  dict: t,
}: {
  workspaceId: string;
  memberProfileId: string;
  defaults: CoachingControlDefaults;
  dict: CoachingControlDictionary;
}) {
  const [goal, setGoal] = useState(defaults.goal);
  const [gender, setGender] = useState(defaults.gender);
  const [age, setAge] = useState(defaults.age);
  const [heightCm, setHeightCm] = useState(defaults.heightCm);
  const [weightKg, setWeightKg] = useState(defaults.weightKg);
  const [activityLevel, setActivityLevel] = useState(defaults.activityLevel);
  const [proteinPerKg, setProteinPerKg] = useState(defaults.proteinPerKg);
  const [fatRatioPercent, setFatRatioPercent] = useState(defaults.fatRatioPercent);
  const [mealsPerDay, setMealsPerDay] = useState(defaults.mealsPerDay);
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(defaults.trainingDaysPerWeek);
  const [calorieOffset, setCalorieOffset] = useState(defaults.calorieOffset);

  const target = useMemo(() => calculateNutritionTargets({
    gender,
    age: Math.max(12, Math.min(90, age)),
    heightCm: Math.max(120, Math.min(230, heightCm)),
    weightKg: Math.max(35, Math.min(250, weightKg)),
    activityLevel,
    goal,
    proteinPerKg: Math.max(1.2, Math.min(3, proteinPerKg)),
    fatRatio: Math.max(0.15, Math.min(0.5, fatRatioPercent / 100)),
    mealsPerDay,
    trainingDaysPerWeek,
  }), [activityLevel, age, fatRatioPercent, gender, goal, heightCm, mealsPerDay, proteinPerKg, trainingDaysPerWeek, weightKg]);
  const finalCalories = Math.max(800, target.targetCalories + calorieOffset);
  const finalCarbs = Math.max(0, Math.round((finalCalories - (target.proteinG * 4) - (target.fatG * 9)) / 4));

  return (
    <form action={saveCoachAdjustmentAction} className="controlDecisionForm">
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <input name="memberProfileId" type="hidden" value={memberProfileId} />

      <section className="controlFormSection controlCalculationSection">
        <div className="controlSectionHeading">
          <span className="controlStepNumber">2</span>
          <div><h2>{t.calculator}</h2><p>{t.calculatorText}</p></div>
          <Calculator aria-hidden="true" size={22} />
        </div>

        <div className="controlInputGrid">
          <label>{t.goal}<select name="goal" value={goal} onChange={(event) => setGoal(event.target.value as NutritionGoal)}>
            {Object.entries(t.goals).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>{t.sex}<select name="gender" value={gender} onChange={(event) => setGender(event.target.value as Gender)}><option value="male">{t.male}</option><option value="female">{t.female}</option></select></label>
          <label>{t.age}<input min="12" max="90" name="age" type="number" value={age} onChange={(event) => setAge(numberFrom(event.target.value, age))} /></label>
          <label>{t.height}<input min="120" max="230" name="heightCm" step="0.1" type="number" value={heightCm} onChange={(event) => setHeightCm(numberFrom(event.target.value, heightCm))} /></label>
          <label>{t.weightInput}<input min="35" max="250" name="weightKg" step="0.1" type="number" value={weightKg} onChange={(event) => setWeightKg(numberFrom(event.target.value, weightKg))} /></label>
          <label>{t.activity}<select name="activityLevel" value={activityLevel} onChange={(event) => setActivityLevel(event.target.value as ActivityLevel)}>
            {Object.entries(t.activities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>{t.protein}<input min="1.2" max="3" name="proteinPerKg" step="0.1" type="number" value={proteinPerKg} onChange={(event) => setProteinPerKg(numberFrom(event.target.value, proteinPerKg))} /></label>
          <label>{t.fat}<input min="15" max="50" name="fatRatioPercent" step="1" type="number" value={fatRatioPercent} onChange={(event) => setFatRatioPercent(numberFrom(event.target.value, fatRatioPercent))} /></label>
          <label>{t.meals}<select name="mealsPerDay" value={mealsPerDay} onChange={(event) => setMealsPerDay(numberFrom(event.target.value, mealsPerDay))}><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label>
        </div>

        <div className="controlFineTune">
          <div><span>{t.baseCalculation}</span><strong>{target.targetCalories} {t.calories}</strong><small>BMR {target.bmr} · TDEE {target.tdee}</small></div>
          <label>
            {t.calorieFineTune}
            <span className="controlOffsetInput">
              <button aria-label="-25 kcal" type="button" onClick={() => setCalorieOffset((value) => Math.max(-750, value - 25))}><Minus size={15} /></button>
              <input min="-750" max="750" name="calorieOffset" step="25" type="number" value={calorieOffset} onChange={(event) => setCalorieOffset(numberFrom(event.target.value, calorieOffset))} />
              <button aria-label="+25 kcal" type="button" onClick={() => setCalorieOffset((value) => Math.min(750, value + 25))}><Plus size={15} /></button>
            </span>
          </label>
        </div>

        <div className="controlTargets" aria-live="polite">
          <div className="controlTargetPrimary"><span>{t.finalTargets}</span><strong>{finalCalories}</strong><small>{t.calories}</small></div>
          <div><span>{t.proteinShort}</span><strong>{target.proteinG} g</strong></div>
          <div><span>{t.carbsShort}</span><strong>{finalCarbs} g</strong></div>
          <div><span>{t.fatShort}</span><strong>{target.fatG} g</strong></div>
          <div><span>{t.water}</span><strong>{(target.waterMl / 1000).toFixed(1)} L</strong></div>
          <div><span>{t.fiber}</span><strong>{target.fiberG} g</strong></div>
        </div>
        <p className="controlFormulaNotice">{t.sourceWarning}</p>
      </section>

      <section className="controlFormSection">
        <div className="controlSectionHeading">
          <span className="controlStepNumber">3</span>
          <div><h2>{t.training}</h2><p>{t.publishHelp}</p></div>
        </div>
        <div className="controlInputGrid decision">
          <label>{t.trainingDays}<input min="1" max="7" name="trainingDaysPerWeek" type="number" value={trainingDaysPerWeek} onChange={(event) => setTrainingDaysPerWeek(numberFrom(event.target.value, trainingDaysPerWeek))} /></label>
          <label>{t.currentWeek}<input defaultValue={defaults.currentTrainingWeek} min="1" max="12" name="currentTrainingWeek" type="number" /></label>
          <label>{t.steps}<input defaultValue={defaults.dailyStepsTarget} min="0" max="100000" name="dailyStepsTarget" step="250" type="number" /></label>
          <label>{t.effectiveOn}<input defaultValue={defaults.effectiveOn} name="effectiveOn" type="date" /></label>
          <label>{t.nextReview}<input defaultValue={defaults.nextReviewOn} name="nextReviewOn" type="date" /></label>
        </div>
        <div className="controlNotesGrid">
          <label>{t.rationale}<small>{t.rationaleHelp}</small><textarea defaultValue={defaults.rationale} name="rationale" placeholder={t.rationalePlaceholder} rows={5} /></label>
          <label>{t.memberMessage}<small>{t.memberMessageHelp}</small><textarea defaultValue={defaults.memberMessage} name="memberMessage" placeholder={t.memberMessagePlaceholder} rows={5} /></label>
        </div>
      </section>

      <section className="controlPublishBar">
        <div><LockKeyhole aria-hidden="true" size={18} /><span><strong>{t.privateTitle}</strong><small>{t.privateText}</small></span></div>
        <div className="controlPublishActions">
          <SubmitButton name="intent" value="draft"><Save size={16} />{t.draft}</SubmitButton>
          <SubmitButton name="intent" value="published" variant="primary"><Send size={16} />{t.publish}</SubmitButton>
        </div>
      </section>
    </form>
  );
}
