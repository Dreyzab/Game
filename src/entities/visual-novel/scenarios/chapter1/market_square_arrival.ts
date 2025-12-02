import type { SceneMap } from '../../model/types'
import { BACKGROUNDS } from '@/shared/data/visualNovel/backgrounds'

export const scenarios: SceneMap = {
  market_square_arrival: {
    id: 'market_square_arrival',
    background: BACKGROUNDS.freiburg_market,
    characters: [],
    dialogue: [
      {
        speaker: 'Narrator',
        text: 'The market square opens in front of you: stalls, smells of food, fragments of conversations, and the distant ringing of a tram. After the cramped alleys this place feels almost overwhelming.',
      },
      {
        speaker: 'Narrator',
        text: 'Vendors shout over each other, students rush past with coffee, and somewhere nearby a street musician is struggling to tune his guitar against the city noise.',
      },
      {
        speaker: 'Protagonist',
        text: 'Okay… Focus. I am not here as a tourist. There are clues hidden in this chaos — people, posters, maybe even a familiar face among the crowd.',
        emotion: { primary: 'surprised', intensity: 70 },
      },
      {
        speaker: 'Narrator',
        text: 'Your gaze slides over the food stalls, the improvised notice board, and the tight cluster of umbrellas where students are huddling with their laptops.',
        emotion: { primary: 'neutral', intensity: 80 },
      },
      {
        speaker: 'Narrator',
        text: 'Somewhere here must be the stall of Elias, the trader you were told about — if you can spot it before the crowd swallows you again.',
      },
    ],
    choices: [
      {
        id: 'look_at_kitchen',
        text: '[Look at the food stalls] The smells of spices and roasted vegetables pull your attention toward a small improvised kitchen under a striped awning.',
        nextScene: 'market_node_kitchen',
      },
      {
        id: 'look_at_market',
        text: '[Survey the central square] You take a step back and try to take in the whole market at once, hoping that distance will help you notice details.',
        nextScene: 'market_node_market',
      },
      {
        id: 'look_at_posters',
        text: '[Examine the posters] A dense patch of flyers and announcements on a nearby board looks like a good place to search for hints.',
        nextScene: 'market_node_posters',
      },
      {
        id: 'find_elias_shop',
        text: '[Try to find Elias’s stall] You narrow your eyes and scan the stands for anything that looks like a place where information and odd goods are traded.',
        presentation: {
          color: 'skill',
          icon: 'logic',
          tooltip: 'Logic skill check: notice the small but telling details in the arrangement of stalls.',
        },
        nextScene: 'trader_meeting_dialog',
        availability: {
          skillCheck: {
            skill: 'logic',
            difficulty: 6,
            successText:
              'Patterns emerge from the noise: the way people move, where they stall, how some avoid one particular stand. You are pretty sure you have found Elias.',
            failureText:
              'Everything blends into one big blur of noise and color. Maybe you should gather more context before trying again.',
          },
        },
        effects: {
          xp: 5,
        },
      },
    ],
  },
}

