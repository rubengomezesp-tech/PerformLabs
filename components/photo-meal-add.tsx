"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { smartAddMealPhotoAction } from "@/app/app/(gated)/diary/actions";

type State = "idle" | "working" | "done" | "error";

async function fileToDownscaledBase64(file: File, maxSize = 1024): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("img"));
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl.split(",")[1] ?? "";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1] ?? "";
}

export function PhotoMealAdd({ workspaceId, date }: { workspaceId: string; date: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setState("working");
    setMessage("");
    try {
      const base64 = await fileToDownscaledBase64(file);
      const result = await smartAddMealPhotoAction({ workspaceId, base64, mediaType: "image/jpeg", date });
      if (result.ok) {
        setState("done");
        setMessage(`${result.name} · ${result.calories} kcal · ${result.protein} P / ${result.carbs} C / ${result.fat} G`);
      } else {
        setState("error");
        setMessage(result.error);
      }
    } catch {
      setState("error");
      setMessage("No se pudo procesar la foto. Inténtalo de nuevo.");
    }
  }

  return (
    <div className="photoMealAdd">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      <button
        type="button"
        className="btn primary"
        onClick={() => inputRef.current?.click()}
        disabled={state === "working"}
        aria-busy={state === "working"}
      >
        {state === "working" ? <><Loader2 size={16} className="spinIcon" /> Analizando foto…</> : <><Camera size={16} /> Hacer foto a la comida</>}
      </button>

      {state === "done" ? (
        <p className="photoMealResult ok"><CheckCircle2 size={15} /> Añadido: {message}</p>
      ) : state === "error" ? (
        <p className="photoMealResult err">{message} <button type="button" className="linkBtn" onClick={() => inputRef.current?.click()}><RefreshCw size={13} /> Reintentar</button></p>
      ) : null}
    </div>
  );
}
