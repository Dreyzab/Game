/**
 * Central registry of all Visual Novel Scenarios.
 * This file serves as the single source of truth for the SceneRegistry.
 */
import { scenarios as prologue } from './prolog/scenarioTr-ST'
import { chapter1Scenes as chapter1 } from './chapter1'
import { allTutorialScenes as tutorial } from './tutorial'

// Add future chapters here
// import { chapter2Scenes as chapter2 } from './chapter2'

/*
 * Mapping of ChapterID -> Collection of Scenes.
 * The keys here define the canonical Namespace for each chapter.
 */
export const SCENARIO_CHAPTERS = {
    prologue,
    chapter1,
    tutorial,
    // chapter2, 
} as const
