"use client";

import * as React from "react";

export type Lang = "en" | "es";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
type Dict = Record<string, any>;

const en: Dict = {
  nav: {
    home: "Home",
    play: "Play",
    ranking: "Ranking",
    logout: "Logout",
    signIn: "Sign in",
    language: "Language",
  },
  home: {
    hero: {
      liveBeta: "live beta",
      multiplayer: "multiplayer",
      poweredBy: "powered by Google Street View",
      titleA: "Drop a pin.",
      titleB: "Win the world.",
      description:
        "GeoPin is a real-time multiplayer geography game. Explore a random spot on Earth, guess its location, and climb the leaderboard — with your friends or against the planet.",
      playNow: "Play now",
      multiplayerBtn: "Multiplayer",
      seeRanking: "See ranking",
      statRounds: "Rounds played",
      statAvg: "Avg round",
      statAvgValue: "2 min",
      statPlayers: "Max players",
    },
    preview: {
      eyebrow: "Gameplay",
      title: "A glance at a live round",
      subtitle:
        "Full-bleed Street View, scoreboards in the corners, mini-map to drop your guess.",
    },
    how: {
      eyebrow: "How it works",
      title: "Three steps, five rounds",
      subtitle:
        "Every match is 5 panoramas pulled live from Google. No two games play the same.",
      s1t: "Explore",
      s1b: "You're dropped onto a real Street View somewhere on Earth — no warning, no clue, just the environment.",
      s2t: "Drop the pin",
      s2b: "Click anywhere on the world map. Refine as long as the timer runs.",
      s3t: "Score",
      s3b: "The closer your guess, the more points. Bullseye gets 5 000.",
    },
    packs: {
      eyebrow: "Map packs",
      title: "Pick your battleground",
      subtitle: "Hand-picked regions, or build your own pack from 60+ countries.",
      countries: "countries",
      buildTitle: "Build your own",
      buildBody: "Andes, Mediterranean, capitals — whatever you want.",
    },
    features: {
      eyebrow: "Why GeoPin",
      title: "Built for the long haul",
      subtitle:
        "Real-time, random, and scaling from a living-room game to a global league.",
      f1t: "Real-time WebSockets",
      f1b: "Rounds, timers, and guesses stream instantly to every player with Redis-backed pub/sub.",
      f2t: "Drop-in multiplayer",
      f2b: "Create a 6-letter code and your friends are in. Up to 10 players per room, guest mode supported.",
      f3t: "Anti-cheat scoring",
      f3b: "Haversine distance + exponential decay computed server-side. No client can fake a 5000.",
      f4t: "Endless locations",
      f4b: "Every round asks Google for a random real panorama — you'll never memorize the dataset.",
      f5t: "Configurable rounds",
      f5b: "Tune duration per pack. Fast-play 30s duels or 5-minute explorer mode.",
      f6t: "Leaderboards",
      f6b: "Global and per-country rankings, refreshed async via BullMQ so the UI stays snappy.",
    },
    ranking: {
      badge: "leaderboard",
      titleHi: "Champions",
      titleRest: " of the globe",
      description:
        "Every finished match feeds the ranking. Climb it solo or push a rival off the podium in head-to-head duels.",
      full: "Full leaderboard",
      empty: "No games played yet — be the first on the board.",
    },
    cta: {
      titleA: "Ready to ",
      titleHi: "guess the globe",
      titleB: "?",
      description:
        "No install. Sign in as guest and you're a pin away from the leaderboard.",
      play: "Play a match",
      create: "Create account",
    },
    footer: {
      play: "Play",
      leaderboard: "Leaderboard",
      maps: "Maps by Google",
    },
  },
  auth: {
    join: "Join GeoPin",
    login: "login",
    register: "register",
    guest: "guest",
    emailOrUsername: "Email or username",
    email: "Email",
    username: "Username",
    usernameHint: "3-24 chars, letters/numbers/_-",
    guestName: "Guest name",
    guestHint: "Optional — we'll generate one if you leave it blank",
    password: "Password",
    passwordHint: "At least 8 characters",
    createAccount: "Create account",
    playAsGuest: "Play as guest",
    signIn: "Sign in",
    welcome: "Welcome, {name}!",
    failed: "Auth failed",
    wrong: "Something went wrong",
  },
  leaderboard: {
    title: "🏆 Global Ranking",
    top: "top 50",
    loading: "Loading…",
    empty: "No games played yet. Be the first on the board!",
    soloBests: "Solo personal bests",
    thisDevice: "this device",
    recentGames: "Recent solo games",
  },
  play: {
    createTitle: "Create a room",
    createDesc:
      "Spin up a fresh lobby. Share the 6-letter code with up to 9 friends.",
    createBtn: "Create room",
    joinTitle: "Join a room",
    code: "Room code",
    codePlaceholder: "e.g. A7F2QC",
    joinBtn: "Join",
    lobby: "Lobby",
    mapPack: "Map pack",
    hostPick: "host pick",
    createPack: "Create pack",
    createPackSub: "your own countries",
    selectedPack: "Selected pack:",
    world: "World",
    startGame: "Start game",
    rounds: "rounds",
    picking: "Picking panoramas…",
    waitingHost: "waiting for host",
    leave: "Leave",
    guess: "GUESS",
    dropPin: "drop a pin on the map",
    guessLocked: "Guess locked — waiting",
    nextRound: "Next round →",
    waitingHostDots: "waiting for host…",
    distance: "distance",
    score: "score",
    roundReveal: "Round reveal",
    yourScore: "your score",
    away: "{dist} away",
    noGuess: "No guess — 0 points",
    gameOver: "🏁 Game over",
    finalStandings: "final standings",
    winner: "winner",
    pts: "pts",
    backToMenu: "Back to menu",
    globalRanking: "Global ranking",
    playAgain: "Play again",
    partialTitle: "Partial coverage",
    partialDesc: "Got {got}/{total} panoramas — backend will fill the rest.",
    couldNotPick: "Could not pick panoramas",
    sessionExpired: "Session expired",
    signInAgain: "Please sign in again.",
    error: "Error",
  },
  hud: {
    awaiting: "awaiting opponent…",
    round: "round",
  },
  solo: {
    title: "Solo mode",
    subtitle:
      "Play instantly — no account, no room, no waiting. Pick a region and go.",
    bestScore: "Best score",
    roundsLabel: "Rounds",
    timeLabel: "Time per round",
    start: "Start game",
    multiplayerInstead: "Multiplayer →",
    loadError:
      "Could not load locations. Check your connection and try again.",
    totalScore: "total score",
    quit: "Quit",
    seeResults: "See results",
    newBest: "🎉 New personal best!",
    outOf: "out of {max} possible",
    changeSettings: "Change settings",
    noGuessShort: "no guess",
    playSolo: "Play solo",
    soloCardTitle: "Play solo",
    soloCardDesc:
      "No account needed. Instant single-player game against the clock.",
    soloCardBtn: "Solo mode",
  },
  pack: {
    title: "Create map pack",
    emoji: "Emoji",
    name: "Name",
    namePlaceholder: "e.g. My favorite Colombia",
    description: "Description",
    descPlaceholder: "Optional — shown under the name in the lobby",
    countries: "Countries ({n})",
    clear: "clear",
    toggleRegion: "toggle region",
    makePublic: "Make this pack public (other users can pick it)",
    cancel: "Cancel",
    create: "Create pack",
    created: 'Pack "{name}" created',
    couldNotCreate: "Could not create pack",
    region: {
      Americas: "Americas",
      Europe: "Europe",
      Asia: "Asia",
      Oceania: "Oceania",
      Africa: "Africa",
    },
  },
};

const es: Dict = {
  nav: {
    home: "Inicio",
    play: "Jugar",
    ranking: "Ranking",
    logout: "Cerrar sesión",
    signIn: "Iniciar sesión",
    language: "Idioma",
  },
  home: {
    hero: {
      liveBeta: "beta en vivo",
      multiplayer: "multijugador",
      poweredBy: "con Google Street View",
      titleA: "Pon un pin.",
      titleB: "Gana el mundo.",
      description:
        "GeoPin es un juego de geografía multijugador en tiempo real. Explora un punto al azar de la Tierra, adivina su ubicación y escala en la clasificación, con tus amigos o contra el planeta.",
      playNow: "Jugar ahora",
      multiplayerBtn: "Multijugador",
      seeRanking: "Ver ranking",
      statRounds: "Rondas jugadas",
      statAvg: "Ronda media",
      statAvgValue: "2 min",
      statPlayers: "Jugadores máx.",
    },
    preview: {
      eyebrow: "Jugabilidad",
      title: "Un vistazo a una ronda en vivo",
      subtitle:
        "Street View a pantalla completa, marcadores en las esquinas y un minimapa para poner tu pin.",
    },
    how: {
      eyebrow: "Cómo funciona",
      title: "Tres pasos, cinco rondas",
      subtitle:
        "Cada partida son 5 panoramas traídos en vivo de Google. No hay dos juegos iguales.",
      s1t: "Explora",
      s1b: "Apareces en un Street View real en algún lugar de la Tierra: sin aviso, sin pistas, solo el entorno.",
      s2t: "Pon el pin",
      s2b: "Haz clic en cualquier punto del mapa mundial. Ajústalo mientras corra el tiempo.",
      s3t: "Puntúa",
      s3b: "Cuanto más cerca esté tu pin, más puntos. El centro exacto da 5 000.",
    },
    packs: {
      eyebrow: "Packs de mapas",
      title: "Elige tu campo de batalla",
      subtitle:
        "Regiones seleccionadas, o crea tu propio pack con más de 60 países.",
      countries: "países",
      buildTitle: "Crea el tuyo",
      buildBody: "Andes, Mediterráneo, capitales… lo que quieras.",
    },
    features: {
      eyebrow: "Por qué GeoPin",
      title: "Hecho para durar",
      subtitle:
        "En tiempo real, aleatorio y escalable: de un juego de salón a una liga global.",
      f1t: "WebSockets en tiempo real",
      f1b: "Rondas, temporizadores y adivinanzas llegan al instante a cada jugador con pub/sub sobre Redis.",
      f2t: "Multijugador inmediato",
      f2b: "Crea un código de 6 letras y tus amigos ya están dentro. Hasta 10 jugadores por sala, con modo invitado.",
      f3t: "Puntuación anti-trampas",
      f3b: "Distancia de Haversine + decaimiento exponencial calculados en el servidor. Ningún cliente puede falsear un 5000.",
      f4t: "Ubicaciones infinitas",
      f4b: "Cada ronda pide a Google un panorama real al azar: nunca memorizarás el conjunto de datos.",
      f5t: "Rondas configurables",
      f5b: "Ajusta la duración por pack. Duelos rápidos de 30s o modo explorador de 5 minutos.",
      f6t: "Clasificaciones",
      f6b: "Rankings globales y por país, actualizados de forma asíncrona con BullMQ para que la interfaz vaya fluida.",
    },
    ranking: {
      badge: "clasificación",
      titleHi: "Campeones",
      titleRest: " del mundo",
      description:
        "Cada partida terminada alimenta el ranking. Súbelo en solitario o tira a un rival del podio en duelos uno a uno.",
      full: "Ranking completo",
      empty: "Aún no se han jugado partidas: sé el primero en la tabla.",
    },
    cta: {
      titleA: "¿Listo para ",
      titleHi: "adivinar el mundo",
      titleB: "?",
      description:
        "Sin instalar nada. Entra como invitado y estás a un pin de la clasificación.",
      play: "Jugar una partida",
      create: "Crear cuenta",
    },
    footer: {
      play: "Jugar",
      leaderboard: "Clasificación",
      maps: "Mapas por Google",
    },
  },
  auth: {
    join: "Únete a GeoPin",
    login: "entrar",
    register: "registro",
    guest: "invitado",
    emailOrUsername: "Correo o usuario",
    email: "Correo",
    username: "Usuario",
    usernameHint: "3-24 caracteres, letras/números/_-",
    guestName: "Nombre de invitado",
    guestHint: "Opcional: generaremos uno si lo dejas en blanco",
    password: "Contraseña",
    passwordHint: "Al menos 8 caracteres",
    createAccount: "Crear cuenta",
    playAsGuest: "Jugar como invitado",
    signIn: "Iniciar sesión",
    welcome: "¡Bienvenido, {name}!",
    failed: "Error de autenticación",
    wrong: "Algo salió mal",
  },
  leaderboard: {
    title: "🏆 Ranking global",
    top: "top 50",
    loading: "Cargando…",
    empty: "Aún no se han jugado partidas. ¡Sé el primero en la tabla!",
    soloBests: "Récords en solitario",
    thisDevice: "este dispositivo",
    recentGames: "Partidas recientes en solitario",
  },
  play: {
    createTitle: "Crea una sala",
    createDesc:
      "Abre una sala nueva. Comparte el código de 6 letras con hasta 9 amigos.",
    createBtn: "Crear sala",
    joinTitle: "Únete a una sala",
    code: "Código de sala",
    codePlaceholder: "ej. A7F2QC",
    joinBtn: "Unirse",
    lobby: "Sala de espera",
    mapPack: "Pack de mapas",
    hostPick: "elige el anfitrión",
    createPack: "Crear pack",
    createPackSub: "tus propios países",
    selectedPack: "Pack seleccionado:",
    world: "Mundo",
    startGame: "Iniciar juego",
    rounds: "rondas",
    picking: "Eligiendo panoramas…",
    waitingHost: "esperando al anfitrión",
    leave: "Salir",
    guess: "ADIVINA",
    dropPin: "pon un pin en el mapa",
    guessLocked: "Adivinanza fijada — esperando",
    nextRound: "Siguiente ronda →",
    waitingHostDots: "esperando al anfitrión…",
    distance: "distancia",
    score: "puntos",
    roundReveal: "Resultado de la ronda",
    yourScore: "tu puntuación",
    away: "a {dist}",
    noGuess: "Sin adivinanza — 0 puntos",
    gameOver: "🏁 Fin del juego",
    finalStandings: "clasificación final",
    winner: "ganador",
    pts: "pts",
    backToMenu: "Volver al menú",
    globalRanking: "Ranking global",
    playAgain: "Jugar de nuevo",
    partialTitle: "Cobertura parcial",
    partialDesc: "Obtuvimos {got}/{total} panoramas — el servidor completará el resto.",
    couldNotPick: "No se pudieron elegir panoramas",
    sessionExpired: "Sesión expirada",
    signInAgain: "Vuelve a iniciar sesión.",
    error: "Error",
  },
  hud: {
    awaiting: "esperando rival…",
    round: "ronda",
  },
  solo: {
    title: "Modo solitario",
    subtitle:
      "Juega al instante: sin cuenta, sin sala, sin esperas. Elige una región y listo.",
    bestScore: "Mejor puntuación",
    roundsLabel: "Rondas",
    timeLabel: "Tiempo por ronda",
    start: "Empezar partida",
    multiplayerInstead: "Multijugador →",
    loadError:
      "No se pudieron cargar ubicaciones. Revisa tu conexión e inténtalo de nuevo.",
    totalScore: "puntuación total",
    quit: "Salir",
    seeResults: "Ver resultados",
    newBest: "🎉 ¡Nuevo récord personal!",
    outOf: "de {max} posibles",
    changeSettings: "Cambiar ajustes",
    noGuessShort: "sin pin",
    playSolo: "Jugar solo",
    soloCardTitle: "Juega en solitario",
    soloCardDesc:
      "Sin cuenta. Partida individual instantánea contra el reloj.",
    soloCardBtn: "Modo solitario",
  },
  pack: {
    title: "Crear pack de mapas",
    emoji: "Emoji",
    name: "Nombre",
    namePlaceholder: "ej. Mi Colombia favorita",
    description: "Descripción",
    descPlaceholder: "Opcional: se muestra bajo el nombre en la sala",
    countries: "Países ({n})",
    clear: "limpiar",
    toggleRegion: "alternar región",
    makePublic: "Hacer este pack público (otros usuarios podrán elegirlo)",
    cancel: "Cancelar",
    create: "Crear pack",
    created: 'Pack "{name}" creado',
    couldNotCreate: "No se pudo crear el pack",
    region: {
      Americas: "América",
      Europe: "Europa",
      Asia: "Asia",
      Oceania: "Oceanía",
      Africa: "África",
    },
  },
};

const DICTS: Record<Lang, Dict> = { en, es };

function resolve(dict: Dict, path: string): string | undefined {
  return path
    .split(".")
    .reduce<any>((acc, k) => (acc == null ? undefined : acc[k]), dict);
}

function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? String(vars[k]) : `{${k}}`,
  );
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = React.createContext<I18nCtx | null>(null);

const STORAGE_KEY = "geopin.lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with "en" on both server and first client render to avoid hydration
  // mismatch, then hydrate the persisted choice on mount.
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "en" || saved === "es") setLangState(saved);
  }, []);

  const setLang = React.useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const hit = resolve(DICTS[lang], key) ?? resolve(DICTS.en, key) ?? key;
      return typeof hit === "string" ? interpolate(hit, vars) : key;
    },
    [lang],
  );

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within <I18nProvider>");
  return ctx;
}
