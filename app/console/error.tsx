"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Console section error:", error);
  }, [error]);

  return (
    <div className="memberErrorState">
      <AlertTriangle size={42} color="var(--accent)" />
      <h1>Algo no cargó bien.</h1>
      <p>Hubo un problema al mostrar esta sección de la consola. Vuelve a intentarlo.</p>
      <div className="memberErrorActions">
        <button className="btn primary" type="button" onClick={() => reset()}>
          <RotateCw size={16} /> Reintentar
        </button>
        <Link className="btn" href="/console">
          <Home size={16} /> Ir al inicio
        </Link>
      </div>
    </div>
  );
}
