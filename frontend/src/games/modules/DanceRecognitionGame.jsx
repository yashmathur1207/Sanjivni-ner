import React, { useState, useMemo, useRef } from "react";

// --- Assets ---------------------------------------------------------------
// Place the 8 image files (provided alongside this component) into:
//   frontend/src/assets/dances/
// Filenames must match exactly: sattriya.png, bihu.png, bagurumba.png,
// ojapali.png, lai-haroba.png, thang-ta.png, pung-cholom.png, raas-leela.png
import sattriyaImg from "../../assets/dances/sattriya.png";
import bihuImg from "../../assets/dances/bihu.png";
import bagurumbaImg from "../../assets/dances/bagurumba.png";
import ojapaliImg from "../../assets/dances/ojapali.png";
import laiHarobaImg from "../../assets/dances/lai-haroba.png";
import thangTaImg from "../../assets/dances/thang-ta.png";
import pungCholomImg from "../../assets/dances/pung-cholom.png";
import raasLeelaImg from "../../assets/dances/raas-leela.png";

// --- Data -------------------------------------------------------------
const DANCES = [
  { id: "sattriya", answer: "Sattriya", image: sattriyaImg },
  { id: "bihu", answer: "Bihu", image: bihuImg },
  { id: "bagurumba", answer: "Bagurumba", image: bagurumbaImg },
  { id: "ojapali", answer: "Ojapali", image: ojapaliImg },
  { id: "lai-haroba", answer: "Lai Haroba", image: laiHarobaImg },
  { id: "thang-ta", answer: "Thang-Ta", image: thangTaImg },
  { id: "pung-cholom", answer: "Pung Cholom", image: pungCholomImg },
  { id: "raas-leela", answer: "Manipuri Raas Leela", image: raasLeelaImg },
];

// --- i18n ---------------------------------------------------------------
// NOTE: "as" (Assamese) and "mni" (Manipuri) strings are draft translations
// and should be reviewed by a native speaker before shipping. Manipuri is
// romanized (Meiteilon) pending Meitei Mayek script support in the app's
// font stack. Intentionally no "incorrect"/negative strings exist anywhere
// in this game — wrong taps are handled silently through the UI, never text.
const STRINGS = {
  en: {
    prompt: "Which dance is being performed?",
    round: (current, total) => `Round ${current} of ${total}`,
    correct: "Nicely done!",
    next: "Next",
    finish: "See Results",
    resultsTitle: "Great job!",
    scoreLabel: (finalScore) => `You scored ${finalScore} out of 100.`,
  },
  as: {
    prompt: "কোনটো নৃত্য পৰিৱেশন কৰা হৈছে?",
    round: (current, total) => `${total} টাৰ ${current} নং ৰাউণ্ড`,
    correct: "বাঢ়িয়া হৈছে!",
    next: "পৰৱৰ্তী",
    finish: "ফলাফল চাওক",
    resultsTitle: "বাঢ়িয়া কাম!",
    scoreLabel: (finalScore) => `আপুনি ১০০ টাৰ ${finalScore} নম্বৰ পাইছে।`,
  },
  mni: {
    prompt: "Kari jagoi asigi oiribra?",
    round: (current, total) => `Round ${current} / ${total}`,
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

function buildRounds() {
  const order = shuffle(DANCES);
  return order.map((dance) => {
    const distractors = shuffle(
      DANCES.filter((d) => d.id !== dance.id)
    ).slice(0, 3);
    const options = shuffle([dance, ...distractors]).map((d) => ({
      id: d.id,
      label: d.answer,
    }));
    return { ...dance, options };
  });
}

const FADE_DURATION_MS = 300;

// --- Scoring model ---------------------------------------------------------
// Final score is out of 100. Each round is worth (100 / totalRounds) points.
// 80% of a round's points come from accuracy (fewer wrong taps = more
// points), 20% from a gentle speed bonus. Speed is a BONUS only — going
// slow never subtracts points, it just earns a smaller (but still
// positive) bonus. No visible timer or countdown is ever shown; this is
// purely background scoring, matching the "no timers in the game UI" rule.
const ACCURACY_WEIGHT = 0.8;
const SPEED_WEIGHT = 0.2;
const FAST_RESPONSE_MS = 10000; // answered within ~10s -> full speed bonus
const MEDIUM_RESPONSE_MS = 25000; // within ~25s -> partial bonus, else minimal

function getSpeedRatio(responseTimeMs) {
  if (responseTimeMs <= FAST_RESPONSE_MS) return 1;
  if (responseTimeMs <= MEDIUM_RESPONSE_MS) return 0.6;
  return 0.2; // always earns something — never zero, never a penalty
}

export default function DanceRecognitionGame({ language, onComplete }) {
  const t = getStrings(language);

  const [rounds] = useState(() => buildRounds());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [eliminatedIds, setEliminatedIds] = useState(() => new Set());
  const [fadingId, setFadingId] = useState(null);
  const [solved, setSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [detail, setDetail] = useState([]);
  const [finished, setFinished] = useState(false);

  const roundStartRef = useRef(Date.now());
  const wrongAttemptsRef = useRef(0);
  const wrongSelectionsRef = useRef([]);

  const currentRound = rounds[currentIndex];
  const isLastRound = currentIndex === rounds.length - 1;

  const visibleOptions = currentRound.options.filter(
    (o) => !eliminatedIds.has(o.id)
  );

  const handleSelect = (optionId) => {
    if (solved || fadingId) return; // ignore taps mid-animation or after solving

    if (optionId === currentRound.id) {
      // Correct — record and reveal the "next" control. No round is ever
      // "failed"; the person always finds the right answer eventually.
      const responseTimeMs = Date.now() - roundStartRef.current;
      const correctOnFirstTry = wrongAttemptsRef.current === 0;

      // Scoring (out of 100 total): each round is worth 100/rounds.length
      // points. 80% of that comes from accuracy — fewer wrong taps means
      // more points, same "+4/-1"-style curve as before, just rescaled.
      // 20% comes from a gentle speed bonus that never turns negative —
      // a slow-but-correct answer still earns most of the round's points.
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
          danceId: currentRound.id,
          danceName: currentRound.answer,
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

    // Wrong tap: fade the option out smoothly, then remove it. No text,
    // no red state, no "incorrect" language anywhere.
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
    wrongAttemptsRef.current = 0;
    wrongSelectionsRef.current = [];
    roundStartRef.current = Date.now();
  };

  const finishGame = () => {
    const totalWrongAttempts = detail.reduce(
      (sum, r) => sum + r.wrongAttempts,
      0
    );
    const firstTryCorrect = detail.filter((r) => r.correctOnFirstTry).length;
    // Clamp + round the accumulated weighted score to a clean 0-100 integer.
    // A flawless run (no wrong taps, comfortable pace every round) lands
    // exactly on 100.
    const clampedFinalScore = Math.round(
      Math.min(Math.max(score, 0), 100)
    );
    setFinalScore(clampedFinalScore);
    setFinished(true);

    // Richer payload for the caregiver-facing report. This still travels
    // up through the standard onComplete contract — GameWrapper owns what
    // happens to it from here (this component doesn't call any caregiver
    // API directly, keeping it portable per the plug-and-play rules).
    const metrics = {
      gameId: "dance-recognition",
      totalRounds: rounds.length,
      roundsCompleted: rounds.length,
      finalScore: clampedFinalScore,
      firstTryAccuracy: Number((firstTryCorrect / rounds.length).toFixed(2)),
      totalWrongAttempts,
      averageAttemptsPerRound: Number(
        (rounds.length + totalWrongAttempts) / rounds.length
      ).toFixed(2),
      perRound: detail,
      cognitiveDomain: "Visual Recognition & Semantic Memory",
      interactionModel: "error-free / elimination", // no punitive feedback used
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

      <div style={styles.imageWrap}>
        <img
          src={currentRound.image}
          alt=""
          style={styles.image}
          draggable={false}
        />
      </div>

      <div style={styles.optionsGrid}>
        {visibleOptions.map((opt) => {
          const isFadingOut = fadingId === opt.id;
          const isSelectedCorrect = solved && opt.id === currentRound.id;
          const isDimmed = solved && opt.id !== currentRound.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              disabled={solved || isFadingOut}
              style={{
                ...styles.optionButton,
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
  imageWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
  },
  image: {
    width: "100%",
    height: 280,
    objectFit: "cover",
    display: "block",
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
    fontSize: 18,
    fontWeight: 500,
    borderRadius: 12,
    border: "2px solid #d1d5db",
    backgroundColor: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    padding: "10px 12px",
    opacity: 1,
    transform: "scale(1)",
    transition: `opacity ${FADE_DURATION_MS}ms ease, transform ${FADE_DURATION_MS}ms ease`,
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