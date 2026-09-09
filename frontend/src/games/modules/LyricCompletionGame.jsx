import React, { useState, useRef, useMemo } from "react";

// --- Audio & Lyrics data ----------------------------------------------
// Demo build: a single real track, "Bistirno Parore" (Bhupen Hazarika).
// The playable clip is a 7-second crop of the original mp3, taken from the
// 30s–37s mark. The player hears that clip, then has to guess the NEXT
// line of lyrics (which corresponds to the following 37s–44s of the
// original song) from 4 options.
//
// File placement:
//   frontend/public/audio/songs/bistirna-parare.mp3   <-- put the trimmed clip here
//
// To add more songs later, push more entries into this array following
// the same shape:
//   1. Drop the trimmed mp3 into frontend/public/audio/songs/
//   2. Reference it below as "/audio/songs/<filename>.mp3"
//   3. Fill lyricSnippet (line(s) heard in the clip), correctNextLine
//      (the line that comes right after), and 3 distractorLines.
const SONGS = [
  {
    id: "bistirna-parare",
    title: "Bistirno Parore (Bhupen Hazarika)",
    audioSrc: "/audio/songs/bistirna-parare.mp3", // 7s clip, 0:30–0:37 of original
    lyricSnippet:
      "বিস্তীৰ্ণ পাৰৰে অসংখ্য জনৰে হাঁহকাৰ শুনিও নিঃশব্দে নিৰৱে",
    correctNextLine: "বুঢ়া লুইত তুমি বুঢ়া লুইত বোৱাঁ কিয়?",
    distractorLines: [
      "সাগৰৰ পিনে তুমি একেলগে বৈ যোৱা",
      "পাহাৰৰ বুকুত তুমি নীৰৱে থাকি যোৱা",
      "জোনাকৰ পোহৰত তুমি হাঁহি হাঁহি বোৱা",
    ],
  },
];

// --- i18n ---------------------------------------------------------------
// NOTE: "as" (Assamese) and "mni" (Manipuri) strings are draft translations
// and should be reviewed by a native speaker before shipping. Manipuri is
// romanized (Meiteilon) pending Meitei Mayek script support in the app's
// font stack. As with the dance game, no negative/"incorrect" strings
// exist anywhere — wrong taps are handled silently through the UI.
const STRINGS = {
  en: {
    prompt: "Complete the lyrics — what comes next?",
    round: (current, total) => `Round ${current} of ${total}`,
    playButton: "Play Song",
    nowPlaying: "Now playing…",
    pressPlayHint: "Press play and listen, then choose the next line.",
    correct: "Nicely done!",
    next: "Next",
    finish: "See Results",
    resultsTitle: "Great job!",
    scoreLabel: (finalScore) => `You scored ${finalScore} out of 100.`,
  },
  as: {
    prompt: "গীতৰ পঙক্তি সম্পূৰ্ণ কৰক — পিছত কি আহিব?",
    round: (current, total) => `${total} টাৰ ${current} নং ৰাউণ্ড`,
    playButton: "গান বজাওক",
    nowPlaying: "বাজি আছে…",
    pressPlayHint: "প্লে টিপক আৰু শুনক, তাৰ পিছত পৰৱৰ্তী পঙক্তি বাছক।",
    correct: "বাঢ়িয়া হৈছে!",
    next: "পৰৱৰ্তী",
    finish: "ফলাফল চাওক",
    resultsTitle: "বাঢ়িয়া কাম!",
    scoreLabel: (finalScore) => `আপুনি ১০০ টাৰ ${finalScore} নম্বৰ পাইছে।`,
  },
  mni: {
    prompt: "Isei adu loisillu — matam ase kari lakkani?",
    round: (current, total) => `Round ${current} / ${total}`,
    playButton: "Isei Houdok",
    nowPlaying: "Houri…",
    pressPlayHint: "Play tammu amasung tabiyu, adudagi matung-gi line khanbiyu.",
    correct: "Phare!",
    next: "Machin",
    finish: "Result Yengu",
    resultsTitle: "Yamna Phare!",
    scoreLabel: (finalScore) => `Nahakna 100 na ${finalScore} phangba.`,
  },
};

function getStrings(language) {
  return STRINGS[language] || STRINGS.en;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build round order + 4 shuffled options (1 correct next-line + 3 distractors)
function buildRounds() {
  const order = shuffle(SONGS);
  return order.map((song) => {
    const options = shuffle([
      { id: `${song.id}-correct`, label: song.correctNextLine, isCorrect: true },
      ...song.distractorLines.map((line, i) => ({
        id: `${song.id}-distractor-${i}`,
        label: line,
        isCorrect: false,
      })),
    ]);
    return { ...song, options };
  });
}

const FADE_DURATION_MS = 300;

// --- Scoring model (identical to the dance recognition game) ---------------
// Final score is out of 100. Each round is worth (100 / totalRounds) points.
// 80% of a round's points come from accuracy (fewer wrong taps = more
// points), 20% from a gentle speed bonus. Speed is a BONUS only — going
// slow never subtracts points, it just earns a smaller (but still
// positive) bonus. No visible countdown is ever shown.
const ACCURACY_WEIGHT = 0.8;
const SPEED_WEIGHT = 0.2;
const FAST_RESPONSE_MS = 10000;
const MEDIUM_RESPONSE_MS = 25000;

function getSpeedRatio(responseTimeMs) {
  if (responseTimeMs <= FAST_RESPONSE_MS) return 1;
  if (responseTimeMs <= MEDIUM_RESPONSE_MS) return 0.6;
  return 0.2;
}

export default function LyricCompletionGame({ language, onComplete }) {
  const t = getStrings(language);

  const [rounds] = useState(() => buildRounds());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [eliminatedIds, setEliminatedIds] = useState(() => new Set());
  const [fadingId, setFadingId] = useState(null);
  const [solved, setSolved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [detail, setDetail] = useState([]);
  const [finished, setFinished] = useState(false);

  const audioRef = useRef(null);
  const roundStartRef = useRef(null); // set only once first playback ends
  const hasPlayedOnceRef = useRef(false);
  const wrongAttemptsRef = useRef(0);
  const wrongSelectionsRef = useRef([]);

  const currentRound = rounds[currentIndex];
  const isLastRound = currentIndex === rounds.length - 1;

  const visibleOptions = currentRound.options.filter(
    (o) => !eliminatedIds.has(o.id)
  );

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (!hasPlayedOnceRef.current) {
      hasPlayedOnceRef.current = true;
      setHasPlayedOnce(true);
      // The response-time clock starts here, not when the round loads —
      // it wouldn't be fair to count listening time against the player.
      roundStartRef.current = Date.now();
    }
  };

  const handlePlayClick = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    setIsPlaying(true);
    try {
      audioEl.currentTime = 0;
    } catch (e) {
      // ignore — some browsers disallow this before metadata loads
    }

    const playPromise = audioEl.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Placeholder/missing mp3 fallback: simulate the song finishing
        // after a few seconds so the rest of the game is still testable
        // before real audio files are added. Remove this once real mp3s
        // are in place — real playback will fire the normal onEnded event.
        setTimeout(() => handleAudioEnded(), 4000);
      });
    }
  };

  const handleSelect = (optionId) => {
    if (!hasPlayedOnce || solved || fadingId) return;

    const chosen = currentRound.options.find((o) => o.id === optionId);

    if (chosen?.isCorrect) {
      const responseTimeMs = Date.now() - (roundStartRef.current ?? Date.now());
      const correctOnFirstTry = wrongAttemptsRef.current === 0;

      const maxPerRound = 100 / rounds.length;
      const accuracyRatio = Math.max(4 - wrongAttemptsRef.current, 1) / 4;
      const speedRatio = getSpeedRatio(responseTimeMs);

      const accuracyPoints = accuracyRatio * maxPerRound * ACCURACY_WEIGHT;
      const speedPoints = speedRatio * maxPerRound * SPEED_WEIGHT;
      const roundScore = accuracyPoints + speedPoints;

      setSolved(true);
      setScore((s) => s + roundScore);
      setDetail((d) => [
        ...d,
        {
          songId: currentRound.id,
          songTitle: currentRound.title,
          correctOnFirstTry,
          wrongAttempts: wrongAttemptsRef.current,
          wrongSelections: wrongSelectionsRef.current,
          responseTimeMs,
          accuracyPoints: Number(accuracyPoints.toFixed(2)),
          speedPoints: Number(speedPoints.toFixed(2)),
          roundScore: Number(roundScore.toFixed(2)),
        },
      ]);
      return;
    }

    // Wrong tap: fade out smoothly, no text, no red state.
    wrongAttemptsRef.current += 1;
    wrongSelectionsRef.current = [...wrongSelectionsRef.current, optionId];
    setFadingId(optionId);
    setTimeout(() => {
      setEliminatedIds((prev) => {
        const next = new Set(prev);
        next.add(optionId);
        return next;
      });
      setFadingId(null);
    }, FADE_DURATION_MS);
  };

  const handleNext = () => {
    if (isLastRound) {
      finishGame();
      return;
    }
    setCurrentIndex((i) => i + 1);
    setEliminatedIds(new Set());
    setFadingId(null);
    setSolved(false);
    setIsPlaying(false);
    setHasPlayedOnce(false);
    hasPlayedOnceRef.current = false;
    roundStartRef.current = null;
    wrongAttemptsRef.current = 0;
    wrongSelectionsRef.current = [];
  };

  const finishGame = () => {
    const totalWrongAttempts = detail.reduce(
      (sum, r) => sum + r.wrongAttempts,
      0
    );
    const firstTryCorrect = detail.filter((r) => r.correctOnFirstTry).length;
    const clampedFinalScore = Math.round(Math.min(Math.max(score, 0), 100));
    setFinalScore(clampedFinalScore);
    setFinished(true);

    const metrics = {
      gameId: "lyric-completion",
      totalRounds: rounds.length,
      roundsCompleted: rounds.length,
      finalScore: clampedFinalScore,
      firstTryAccuracy: Number((firstTryCorrect / rounds.length).toFixed(2)),
      totalWrongAttempts,
      averageAttemptsPerRound: Number(
        (rounds.length + totalWrongAttempts) / rounds.length
      ).toFixed(2),
      perRound: detail,
      cognitiveDomain: "Auditory Memory & Attention",
      interactionModel: "error-free / elimination",
      scoringModel: {
        accuracyWeightPct: ACCURACY_WEIGHT * 100,
        speedWeightPct: SPEED_WEIGHT * 100,
        fastResponseThresholdMs: FAST_RESPONSE_MS,
        mediumResponseThresholdMs: MEDIUM_RESPONSE_MS,
      },
    };
    onComplete(clampedFinalScore, metrics);
  };

  const progressPct = useMemo(
    () => ((currentIndex + (solved ? 1 : 0)) / rounds.length) * 100,
    [currentIndex, solved, rounds.length]
  );

  if (finished) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>{t.resultsTitle}</h2>
        <p style={styles.bodyText}>{t.scoreLabel(finalScore)}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.progressTrack} aria-hidden="true">
        <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
      </div>
      <p style={styles.roundLabel}>
        {t.round(currentIndex + 1, rounds.length)}
      </p>

      <p style={styles.prompt}>{t.prompt}</p>

      {/* Hidden native audio element — playback is driven entirely by the
          custom Play button below, per the "no default browser controls"
          look-and-feel used across the app's games. */}
      <audio
        key={currentRound.id}
        ref={audioRef}
        src={currentRound.audioSrc}
        onEnded={handleAudioEnded}
        preload="none"
        style={{ display: "none" }}
      />

      <div style={styles.audioCard}>
        <button
          type="button"
          onClick={handlePlayClick}
          style={{
            ...styles.playButton,
            ...(isPlaying ? styles.playButtonActive : {}),
          }}
        >
          {isPlaying ? t.nowPlaying : t.playButton}
        </button>

        {hasPlayedOnce && (
          <p style={styles.lyricSnippet}>{currentRound.lyricSnippet}</p>
        )}
        {!hasPlayedOnce && (
          <p style={styles.hintText}>{t.pressPlayHint}</p>
        )}
      </div>

      <div style={styles.optionsGrid}>
        {visibleOptions.map((opt) => {
          const isFadingOut = fadingId === opt.id;
          const isSelectedCorrect = solved && opt.isCorrect;
          const isDimmed = solved && !opt.isCorrect;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              disabled={!hasPlayedOnce || solved || isFadingOut}
              style={{
                ...styles.optionButton,
                ...(!hasPlayedOnce ? styles.optionLocked : {}),
                ...(isFadingOut ? styles.optionFadingOut : {}),
                ...(isSelectedCorrect ? styles.optionCorrect : {}),
                ...(isDimmed ? styles.optionDimmed : {}),
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {solved && (
        <div style={styles.feedbackRow}>
          <p style={styles.feedbackText}>{t.correct}</p>
          <button type="button" onClick={handleNext} style={styles.nextButton}>
            {isLastRound ? t.finish : t.next}
          </button>
        </div>
      )}
    </div>
  );
}

// --- Styles ---------------------------------------------------------------
// Kept consistent with DanceRecognitionGame.jsx's design language.
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 640,
    margin: "0 auto",
    padding: "16px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6d28d9",
    transition: "width 0.3s ease",
  },
  roundLabel: {
    fontSize: 14,
    color: "#6b7280",
    margin: "4px 0 12px",
  },
  prompt: {
    fontSize: 22,
    fontWeight: 600,
    textAlign: "center",
    margin: "0 0 16px",
  },
  audioCard: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#f5f3ff",
    padding: "24px 16px",
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  playButton: {
    minHeight: 56,
    minWidth: 200,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 999,
    border: "none",
    backgroundColor: "#6d28d9",
    color: "#ffffff",
    cursor: "pointer",
    padding: "12px 28px",
  },
  playButtonActive: {
    backgroundColor: "#5b21b6",
  },
  lyricSnippet: {
    marginTop: 16,
    fontSize: 17,
    lineHeight: 1.5,
    textAlign: "center",
    color: "#374151",
    whiteSpace: "pre-line",
  },
  hintText: {
    marginTop: 16,
    fontSize: 15,
    textAlign: "center",
    color: "#6b7280",
  },
  optionsGrid: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  optionButton: {
    minHeight: 64,
    flex: "0 1 260px",
    maxWidth: 280,
    fontSize: 17,
    fontWeight: 500,
    borderRadius: 12,
    border: "2px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    padding: "10px 14px",
    opacity: 1,
    transform: "scale(1)",
    transition: `opacity ${FADE_DURATION_MS}ms ease, transform ${FADE_DURATION_MS}ms ease`,
  },
  optionLocked: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  optionFadingOut: {
    opacity: 0,
    transform: "scale(0.85)",
    pointerEvents: "none",
  },
  optionCorrect: {
    borderColor: "#1a7f37",
    backgroundColor: "#e6f4ea",
    color: "#1a7f37",
  },
  optionDimmed: {
    opacity: 0.5,
  },
  feedbackRow: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    textAlign: "center",
    color: "#1a7f37",
  },
  nextButton: {
    minHeight: 56,
    minWidth: 180,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 12,
    border: "none",
    backgroundColor: "#6d28d9",
    color: "#ffffff",
    cursor: "pointer",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 18,
    textAlign: "center",
  },
};
