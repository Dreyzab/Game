import React from 'react'
import { VisualNovelExperience } from './VisualNovelPage'
import { DEFAULT_VN_SCENE_ID } from '@/entities/visual-novel/model/scenes'

export const ProloguePage: React.FC = () => {
  return <VisualNovelExperience lockedSceneId={DEFAULT_VN_SCENE_ID} headerLabel="Пролог" />
}

export default ProloguePage


