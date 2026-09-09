import React, { useState, useRef, useEffect } from "react";

// --- Photos & descriptions ----------------------------------------------
// PLACEHOLDER SET — replace [Name] below with the real name once known;
// everything else in the description is based on real visual detail in
// the photo. Add more entries the same way as the caregiver uploads more.
//
// HOW TO ADD MORE PHOTOS LATER:
//   1. Drop the image file into frontend/src/assets/memory/
//   2. Add an `import` line for it below, next to the existing ones.
//   3. Add a new object to the MEMORIES array with that image and a short,
//      warm, second-person description (1-2 sentences, simple language).
//   4. "as"/"mni" description fields are optional — if left blank, the
//      English description is shown as a fallback. Ideally written by the
//      caregiver directly, or reviewed by a native speaker before shipping.
import memory1 from "../../assets/memory/memory-1.png";
import memory2 from "../../assets/memory/memory-2.png";

const MEMORIES = [
  {
    id: "memory-1",
    image: memory1,
    description: {
      en: "Everyone gathered outdoors under the trees to celebrate [Name]'s birthday — friends played the guitar and accordion while your whole family sang together.",
      as: "", // TODO: caregiver/native-speaker translation
      mni: "", // TODO: caregiver/native-speaker translation
    },
  },
  {
    id: "memory-2",
    image: memory2,
    // NOTE: read as a wedding day from the garlands, formal attire, and
    // choir robes visible behind the group — correct this line if that's
    // not what this photo actually shows.
    description: {
      en: "This was [Name]'s wedding day — your family stood together in your best clothes, wearing garlands, with the choir singing behind you.",
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

export default function MemoryLaneGame({ language, onComplete }) {
  // NOTE ON `onComplete`: intentionally unused. This is a reflection
  // exercise, not a scored game — no win/lose moment, and by design the
  // person closes it whenever ready via GameWrapper's own exit button
  // rather than being auto-closed. This activity does not report
  // telemetry to the caregiver dashboard (deliberate, see project notes).
  void onComplete;

  const t = getStrings(language);

  const [memoryIndex, setMemoryIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [naturalSize, setNaturalSize] = useState(null); // {width, height}

  // Guards against React 18 StrictMode's dev-only double-invoke of
  // effects. Without this, the "advance to next photo" logic below would
  // silently run twice per real visit in development — advancing the
  // stored index by 2 instead of 1, which (with only 2 photos) made it
  // look like the app was stuck showing the same photo forever. This
  // guard has no effect in production, where effects only ever run once.
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const total = MEMORIES.length;
    let current = 0;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored !== null ? parseInt(stored, 10) : 0;
      current = Number.isFinite(parsed)
        ? ((parsed % total) + total) % total
        : 0;
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) — default to 0
      // rather than crashing the activity.
      current = 0;
    }

    setMemoryIndex(current);

    try {
      const next = (current + 1) % total;
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch (e) {
      // ignore — worst case it always shows the same photo, not a crash
    }
  }, []);

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
          key={memory.id}
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
