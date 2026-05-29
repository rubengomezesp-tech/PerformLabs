"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function MemberAppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Member app section error:", error);
  }, [error]);

  return (
    <div className="memberErrorState">
      <AlertTriangle size={42} color="var(--accent)" />
      <h1>Algo no cargó bien.</h1>
      <p>Hubo un problema al mostrar esta sección. Vuelve a intentarlo; si sigue pasando, tu coach ya está al tanto.</p>
      <div className="memberErrorActions">
        <button className="btn primary" type="button" onClick={() => reset()}>
          <RotateCw size={16} /> Reintentar
        </button>
        <Link className="btn" href="/app">
          <Home size={16} /> Ir al inicio
        </Link>
      </div>
    </div>
  );
}
