import React, { useState, useRef, useEffect } from "react";

// --- Photos & descriptions ----------------------------------------------
// PLACEHOLDER SET — these 2 photos are real, but this is still a small
// starter set. Add more entries below as the caregiver uploads photos.
//
// HOW TO ADD MORE PHOTOS LATER:
//   1. Drop the image file into frontend/src/assets/memory/
//   2. Add an `import` line for it below, next to the existing ones.
//   3. Add a new object to the MEMORIES array with that image and a short,
//      warm, second-person description (1-2 sentences — simple language,
//      no dates/trivia quizzes, just enough to gently prompt recall).
//   4. "as"/"mni" description fields are optional — if left blank, the
//      English description is shown as a fallback. These should ideally be
//      written by the caregiver directly (they know the memory best) or
//      reviewed by a native speaker before shipping.
import memory1 from "../../assets/memory/memory-1.webp";
import memory2 from "../../assets/memory/memory-2.jpg";

const MEMORIES = [
  {
    id: "memory-1",
    image: memory1,
    description: {
      en: "Your family gathered together to celebrate one of the children's birthdays — everyone dressed in their best for the occasion.",
      as: "", // TODO: caregiver/native-speaker translation
      mni: "", // TODO: caregiver/native-speaker translation
    },
  },
  {
    id: "memory-2",
    image: memory2,
    description: {
      en: "You and your family set off on a trip together, standing by the car with your bags packed and ready to go.",
      as: "",
      mni: "",
    },
  },
];

// --- i18n ---------------------------------------------------------------
const STRINGS = {
  en: {
    buttonLabel: "Do You Remember?",
  },
  as: {
    buttonLabel: "আপুনি মনত পেলাব পাৰেনে?",
  },
  mni: {
    buttonLabel: "Nahakna ningsingbra?",
  },
};

function getStrings(language) {
  return STRINGS[language] || STRINGS.en;
}

const STORAGE_KEY = "sanjivni:memoryLaneIndex";

// Reads which photo comes next, and immediately advances the pointer for
// the *following* visit — since GameWrapper fully unmounts this component
// every time the person exits, plain React state can't remember progress
// across separate opens the way it does within a single session.
function getAndAdvanceIndex(total) {
  let current = 0;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored !== null ? parseInt(stored, 10) : 0;
    current = Number.isFinite(parsed) ? ((parsed % total) + total) % total : 0;
  } catch (e) {
    // localStorage unavailable (private browsing, etc.) — just start at 0
    // every time rather than crashing the activity.
    current = 0;
  }

  try {
    const next = (current + 1) % total;
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch (e) {
    // ignore — worst case it always shows the same photo, not a crash
  }

  return current;
}

export default function MemoryLaneGame({ language, onComplete }) {
  // NOTE ON `onComplete`: intentionally unused here. This is a reflection
  // exercise, not a scored game — there's no win/lose moment, and by
  // design the person closes it whenever they're ready via GameWrapper's
  // own exit button rather than being auto-closed. That means this
  // activity does not currently report telemetry to the caregiver
  // dashboard. If that's ever needed, it would take a deliberate design
  // change (see conversation notes) rather than just wiring this back in.
  void onComplete;

  const t = getStrings(language);

  const [memoryIndex] = useState(() => getAndAdvanceIndex(MEMORIES.length));
  const [revealed, setRevealed] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null); // {width, height}

  const memory = MEMORIES[memoryIndex];
  const description = memory.description[language] || memory.description.en;

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setNaturalSize({ width: naturalWidth, height: naturalHeight });
    }
  };

  // Card sizing adapts to the photo's real aspect ratio once it loads.
  // Landscape photos get a wider card; portrait photos get a narrower,
  // taller one — rather than forcing every photo into one fixed shape.
  const isPortrait = naturalSize && naturalSize.height > naturalSize.width;
  const imageWrapStyle = {
    ...styles.imageWrap,
    maxWidth: isPortrait ? 320 : 480,
    aspectRatio: naturalSize
      ? `${naturalSize.width} / ${naturalSize.height}`
      : "4 / 3",
  };

  return (
    <div style={styles.container}>
      <div style={imageWrapStyle}>
        <img
          src={memory.image}
          alt=""
          style={styles.image}
          onLoad={handleImageLoad}
          draggable={false}
        />
      </div>

      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          style={styles.revealButton}
        >
          {t.buttonLabel}
        </button>
      )}

      {revealed && <p style={styles.description}>{description}</p>}
    </div>
  );
}

// --- Styles ---------------------------------------------------------------
// Kept consistent with the app's other games (same purple accent, card
// shadow language) while staying much simpler — no progress bar, no
// scoring UI, since this isn't a round-based activity.
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
  imageWrap: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  revealButton: {
    minHeight: 56,
    minWidth: 220,
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 999,
    border: "none",
    backgroundColor: "#6d28d9",
    color: "#ffffff",
    cursor: "pointer",
    padding: "12px 28px",
  },
  description: {
    fontSize: 19,
    lineHeight: 1.6,
    textAlign: "center",
    color: "#374151",
    maxWidth: 480,
    margin: 0,
  },
};
