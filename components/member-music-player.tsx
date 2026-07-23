"use client";

import { useState } from "react";
import { Dumbbell, ExternalLink, Music2, Radio, TrendingUp, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

type PlaylistKey = "trending" | "workout";

const playlists: Record<PlaylistKey, { embedUrl: string; spotifyUrl: string }> = {
  trending: {
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZEVXbMDoHDwVN2tF?utm_source=generator&theme=0",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZEVXbMDoHDwVN2tF",
  },
  workout: {
    embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator&theme=0",
    spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX76Wlfdnj7AP",
  },
};

const copy: Record<Locale, {
  open: string;
  close: string;
  title: string;
  live: string;
  trending: string;
  workout: string;
  playerTitle: string;
  spotify: string;
  note: string;
}> = {
  es: { open: "Música", close: "Cerrar música", title: "Música para entrenar", live: "Listas oficiales actualizadas", trending: "Tendencias", workout: "Modo entreno", playerTitle: "Reproductor de Spotify", spotify: "Abrir en Spotify", note: "Tú controlas la reproducción. Nunca se inicia sola." },
  en: { open: "Music", close: "Close music", title: "Workout music", live: "Updated official playlists", trending: "Trending", workout: "Workout mode", playerTitle: "Spotify player", spotify: "Open in Spotify", note: "You control playback. It never starts automatically." },
  pt: { open: "Música", close: "Fechar música", title: "Música para treinar", live: "Playlists oficiais atualizadas", trending: "Tendências", workout: "Modo treino", playerTitle: "Player do Spotify", spotify: "Abrir no Spotify", note: "Você controla a reprodução. Nunca começa sozinha." },
  fr: { open: "Musique", close: "Fermer la musique", title: "Musique d'entraînement", live: "Playlists officielles actualisées", trending: "Tendances", workout: "Mode entraînement", playerTitle: "Lecteur Spotify", spotify: "Ouvrir dans Spotify", note: "Vous contrôlez la lecture. Elle ne démarre jamais seule." },
  de: { open: "Musik", close: "Musik schließen", title: "Trainingsmusik", live: "Aktuelle offizielle Playlists", trending: "Trends", workout: "Trainingsmodus", playerTitle: "Spotify-Player", spotify: "In Spotify öffnen", note: "Du steuerst die Wiedergabe. Sie startet nie automatisch." },
  it: { open: "Musica", close: "Chiudi musica", title: "Musica per allenarsi", live: "Playlist ufficiali aggiornate", trending: "Tendenze", workout: "Modalità allenamento", playerTitle: "Player Spotify", spotify: "Apri in Spotify", note: "Controlli tu la riproduzione. Non parte mai automaticamente." },
  zh: { open: "音乐", close: "关闭音乐", title: "训练音乐", live: "官方歌单持续更新", trending: "热门趋势", workout: "训练模式", playerTitle: "Spotify 播放器", spotify: "在 Spotify 中打开", note: "播放由你控制，绝不会自动开始。" },
};

export function MemberMusicPlayer({ locale = "es" }: { locale?: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistKey>("trending");
  const labels = copy[locale];
  const selected = playlists[playlist];

  return (
    <aside className={`memberMusic${isOpen ? " is-open" : ""}`} aria-label={labels.title}>
      {isOpen ? (
        <section className="memberMusicPanel">
          <header className="memberMusicHead">
            <span className="memberMusicSignal" aria-hidden="true"><Radio size={17} /></span>
            <div>
              <strong>{labels.title}</strong>
              <small>{labels.live}</small>
            </div>
            <button className="memberMusicClose" type="button" onClick={() => setIsOpen(false)} aria-label={labels.close}>
              <X size={19} />
            </button>
          </header>

          <div className="memberMusicModes" role="group" aria-label={labels.title}>
            <button className={playlist === "trending" ? "active" : ""} type="button" onClick={() => setPlaylist("trending")} aria-pressed={playlist === "trending"}>
              <TrendingUp size={16} /> {labels.trending}
            </button>
            <button className={playlist === "workout" ? "active" : ""} type="button" onClick={() => setPlaylist("workout")} aria-pressed={playlist === "workout"}>
              <Dumbbell size={16} /> {labels.workout}
            </button>
          </div>

          <iframe
            key={playlist}
            className="memberMusicEmbed"
            src={selected.embedUrl}
            title={`${labels.playerTitle}: ${playlist === "trending" ? labels.trending : labels.workout}`}
            width="100%"
            height="352"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />

          <footer className="memberMusicFoot">
            <small>{labels.note}</small>
            <a href={selected.spotifyUrl} target="_blank" rel="noreferrer">
              {labels.spotify} <ExternalLink size={14} />
            </a>
          </footer>
        </section>
      ) : null}

      <button className="memberMusicTrigger" type="button" onClick={() => setIsOpen((value) => !value)} aria-expanded={isOpen} aria-label={isOpen ? labels.close : labels.open}>
        <span className="memberMusicBars" aria-hidden="true"><i /><i /><i /></span>
        <Music2 size={19} />
        <span>{labels.open}</span>
      </button>
    </aside>
  );
}
