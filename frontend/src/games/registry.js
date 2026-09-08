import { lazy } from 'react';
import { Brain, Image as ImageIcon, Music, Sparkles } from 'lucide-react';

export const GAME_REGISTRY = [
  {
    id: "family-photo-recall",
    title: "Family Photo Recall",
    englishDescription: "Identify family members from uploaded photos.",
    cognitiveDomain: "Episodic Memory",
    icon: ImageIcon,
    component: lazy(() => import('./modules/FamilyPhotoRecall.jsx')), 
  },
  {
    id: "gamosa-pattern-match",
    title: "Cultural Motif Matching",
    englishDescription: "Match traditional Gamosa weaving patterns.",
    cognitiveDomain: "Visuospatial",
    icon: Brain,
    component: lazy(() => import('./modules/GamosaPattern.jsx')), 
  },
  {
    id: "folklore-audio",
    title: "Folklore Listening",
    englishDescription: "Listen to regional stories and answer recall questions.",
    cognitiveDomain: "Attention & Listening",
    icon: Music,
    component: lazy(() => import('./modules/FolkloreAudio.jsx')), 
  },
  {
    id: "dance-recognition",
    title: "Guess the Dance",
    englishDescription: "Look at a photo of a traditional North East Indian dance and pick the correct name from four options.",
    cognitiveDomain: "Visual Recognition & Semantic Memory",
    icon: Sparkles,
    component: lazy(() => import('./modules/DanceRecognitionGame.jsx')),
  }
];