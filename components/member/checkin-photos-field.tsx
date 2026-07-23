"use client";

import { useMemo, useState } from "react";
import { Camera } from "lucide-react";

const ANGLES = [
  ["frontal", "Frontal"],
  ["lateral", "Lateral"],
  ["espalda", "Espalda"],
] as const;

const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
// El límite del server action es 8MB por request COMPLETO (next.config.ts
// bodySizeLimit): si el total lo supera, el check-in entero se rechaza con 413
// antes de ejecutarse. Presupuesto total con margen para el resto de campos.
const MAX_TOTAL_BYTES = 7 * 1024 * 1024;

function formatMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Tres slots etiquetados (frontal/lateral/espalda). El ángulo persiste en el
 * nombre de archivo y alimenta el comparador antes/después. Valida tamaños en
 * cliente ANTES de enviar para que un 413 nunca se trague el check-in.
 */
export function CheckinPhotosField() {
  const [sizes, setSizes] = useState<Record<string, number>>({});

  const totalBytes = useMemo(() => Object.values(sizes).reduce((sum, value) => sum + value, 0), [sizes]);
  const oversizedAngles = ANGLES.filter(([key]) => (sizes[key] ?? 0) > MAX_PHOTO_BYTES).map(([, label]) => label);
  const overBudget = totalBytes > MAX_TOTAL_BYTES;
  const blocked = overBudget || oversizedAngles.length > 0;

  return (
    <fieldset className="checkinPhotosField spanFull" data-blocked={blocked ? "true" : undefined}>
      <legend className="row"><Camera size={16} aria-hidden="true" /> Fotos de progreso (opcional)</legend>
      <div className="checkinPhotoSlots">
        {ANGLES.map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              accept="image/*"
              aria-describedby="checkin-photos-help"
              name={`photo_${key}`}
              onChange={(event) => {
                const input = event.target;
                const file = input.files?.[0];
                const nextSizes = { ...sizes, [key]: file?.size ?? 0 };
                setSizes(nextSizes);
                // setCustomValidity bloquea el submit nativo del form: el 413
                // por body >8MB nunca llega a dispararse.
                const total = Object.values(nextSizes).reduce((sum, value) => sum + value, 0);
                if (file && file.size > MAX_PHOTO_BYTES) {
                  input.setCustomValidity(`Esta foto pesa ${formatMb(file.size)}; el máximo es 8 MB.`);
                } else if (total > MAX_TOTAL_BYTES) {
                  input.setCustomValidity(`Las fotos suman ${formatMb(total)}; el máximo total es ${formatMb(MAX_TOTAL_BYTES)}.`);
                } else {
                  input.setCustomValidity("");
                }
              }}
              type="file"
            />
          </label>
        ))}
      </div>
      {blocked ? (
        <p className="fieldError" role="alert">
          {oversizedAngles.length
            ? `La foto ${oversizedAngles.join(" y ")} supera 8 MB. `
            : ""}
          {overBudget ? `El total (${formatMb(totalBytes)}) supera el límite de ${formatMb(MAX_TOTAL_BYTES)}. ` : ""}
          Usa fotos más ligeras (una captura de pantalla de la foto suele bastar).
        </p>
      ) : (
        <p className="muted" id="checkin-photos-help">
          Misma pose y luz que la vez anterior para poder comparar. Máx. 8 MB por foto.
        </p>
      )}
    </fieldset>
  );
}
