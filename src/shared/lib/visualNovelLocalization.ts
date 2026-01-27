import type { TFunction } from 'i18next'
import type {
  VisualNovelAdvice,
  VisualNovelChoice,
  VisualNovelChoiceRequirement,
  VisualNovelLine,
  VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'

const VN_NAMESPACE = 'visualNovel'

function translateWithDefault(t: TFunction, key: string, defaultValue?: string) {
  if (defaultValue === undefined) {
    return t(key, { ns: VN_NAMESPACE })
  }
  return t(key, {
    ns: VN_NAMESPACE,
    defaultValue,
  })
}

function localizeSkillCheck(
  t: TFunction,
  sceneId: string,
  lineId: string,
  choiceId: string,
  skillCheck: VisualNovelChoiceRequirement['skillCheck']
) {
  if (!skillCheck) return skillCheck
  const baseKey = `scenes.${sceneId}.lines.${lineId}.choices.${choiceId}.requirements.skillCheck`
  return {
    ...skillCheck,
    label: skillCheck.label
      ? translateWithDefault(t, `${baseKey}.label`, skillCheck.label)
      : skillCheck.label,
    successText: skillCheck.successText
      ? translateWithDefault(t, `${baseKey}.successText`, skillCheck.successText)
      : skillCheck.successText,
    failureText: skillCheck.failureText
      ? translateWithDefault(t, `${baseKey}.failureText`, skillCheck.failureText)
      : skillCheck.failureText,
  }
}

function localizeCharacterAdvices(t: TFunction, sceneId: string, lineId: string, advices?: VisualNovelAdvice[]): VisualNovelAdvice[] | undefined {
  if (!advices) return undefined
  const baseLine = `scenes.${sceneId}.lines.${lineId}.characterAdvices`
  return advices.map((advice) => ({
    ...advice,
    text: advice.text
      ? translateWithDefault(t, `${baseLine}.${advice.characterId}.text`, advice.text)
      : advice.text,
    stageDirection: advice.stageDirection
      ? translateWithDefault(t, `${baseLine}.${advice.characterId}.stageDirection`, advice.stageDirection)
      : advice.stageDirection,
  }))
}

function localizeChoice(t: TFunction, sceneId: string, lineId: string, choice: VisualNovelChoice): VisualNovelChoice {
  const baseChoice = `scenes.${sceneId}.lines.${lineId}.choices.${choice.id}`
  const localizedRequirements = choice.requirements
    ? {
        ...choice.requirements,
        skillCheck: localizeSkillCheck(
          t,
          sceneId,
          lineId,
          choice.id,
          choice.requirements.skillCheck as any
        ),
      }
    : undefined

  return {
    ...choice,
    label: choice.label
      ? translateWithDefault(t, `${baseChoice}.label`, choice.label)
      : choice.label,
    description: choice.description
      ? translateWithDefault(t, `${baseChoice}.description`, choice.description)
      : choice.description,
    requirements: localizedRequirements,
  }
}

function localizeLine(t: TFunction, sceneId: string, line: VisualNovelLine): VisualNovelLine {
  const baseLine = `scenes.${sceneId}.lines.${line.id}`
  return {
    ...line,
    text: line.text
      ? translateWithDefault(t, `${baseLine}.text`, line.text)
      : line.text,
    stageDirection: line.stageDirection
      ? translateWithDefault(t, `${baseLine}.stageDirection`, line.stageDirection)
      : line.stageDirection,
    transition: line.transition
      ? {
          ...line.transition,
          label: line.transition.label
            ? translateWithDefault(t, `${baseLine}.transition.label`, line.transition.label)
            : line.transition.label,
        }
      : line.transition,
    choices: line.choices ? line.choices.map((choice) => localizeChoice(t, sceneId, line.id, choice)) : line.choices,
    characterAdvices: localizeCharacterAdvices(t, sceneId, line.id, line.characterAdvices),
  }
}

export function localizeVisualNovelScene(scene: VisualNovelSceneDefinition, t: TFunction) {
  const sceneKey = `scenes.${scene.id}`
  const localizedCharacters = scene.characters.map((character) => ({
    ...character,
    name: translateWithDefault(t, `${sceneKey}.characters.${character.id}.name`, character.name),
    title: character.title
      ? translateWithDefault(t, `${sceneKey}.characters.${character.id}.title`, character.title)
      : character.title,
    tagline: character.tagline
      ? translateWithDefault(t, `${sceneKey}.characters.${character.id}.tagline`, character.tagline)
      : character.tagline,
  }))

  return {
    ...scene,
    title: translateWithDefault(t, `${sceneKey}.title`, scene.title),
    location: translateWithDefault(t, `${sceneKey}.location`, scene.location),
    description: scene.description
      ? translateWithDefault(t, `${sceneKey}.description`, scene.description)
      : scene.description,
    characters: localizedCharacters,
    lines: scene.lines.map((line) => localizeLine(t, scene.id, line)),
  }
}
