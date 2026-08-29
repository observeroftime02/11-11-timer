import { MindfulnessPrompt, TrackerMode } from '../types';

export const MOOD_PRESETS_1111: string[] = [
  'Grateful',
  'Inspired',
  'Peaceful',
  'Serene',
  'Manifesting',
  'Focused',
  'Hopeful',
  'Harmonious',
  'Empowered',
  'Joyful',
  'Curious',
  'Loving',
];

export const MOOD_PRESETS_420: string[] = [
  'Chill',
  'Relaxed',
  'Creative Flow',
  'Grounded',
  'Euphoric',
  'Reflective',
  'Present',
  'Mellow',
  'Warm & Cozy',
  'Free-Spirited',
  'Blissful',
  'Connected',
];

export const ALL_MOOD_PRESETS = Array.from(
  new Set([...MOOD_PRESETS_1111, ...MOOD_PRESETS_420])
);

export const MINDFULNESS_PROMPTS: MindfulnessPrompt[] = [
  {
    id: 'p-1',
    text: 'What intention or wish would bring deep peace to your heart right now?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-2',
    text: 'Pause and take three slow breaths. What subtle feeling or sensation are you noticing?',
    category: 'presence',
    modeBias: 'all',
  },
  {
    id: 'p-3',
    text: 'What is one small, everyday blessing that made you smile or feel warm today?',
    category: 'gratitude',
    modeBias: 'all',
  },
  {
    id: 'p-4',
    text: 'If you could release one lingering tension or worry into the wind right now, what would it be?',
    category: 'grounding',
    modeBias: '420',
  },
  {
    id: 'p-5',
    text: 'What creative spark or spontaneous idea is gently knocking on your mind today?',
    category: 'creativity',
    modeBias: '420',
  },
  {
    id: 'p-6',
    text: 'As the clock synchronizes across the planet, who or what do you send loving kindness to?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-7',
    text: 'How does your body feel in this very moment? Where can you soften your shoulders and jaw?',
    category: 'presence',
    modeBias: '420',
  },
  {
    id: 'p-8',
    text: 'What is something you recently learned about yourself that you appreciate?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-9',
    text: 'What does your ideal, peaceful tomorrow look and feel like?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-10',
    text: 'Describe the vibe around you right now: the sounds, light, temperature, and rhythm.',
    category: 'presence',
    modeBias: '420',
  },
  {
    id: 'p-11',
    text: 'What is a dream or aspiration that you are quietly nurturing step by step?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-12',
    text: 'What music, flavor, or texture resonated with your spirit recently?',
    category: 'creativity',
    modeBias: '420',
  },
  {
    id: 'p-13',
    text: 'Write down one kind thing you can say or do for yourself before the day ends.',
    category: 'gratitude',
    modeBias: 'all',
  },
  {
    id: 'p-14',
    text: 'When you look at the synchronous world clock, how does feeling part of a global collective feel?',
    category: 'reflection',
    modeBias: '1111',
  },
  {
    id: 'p-15',
    text: 'What is bringing you genuine grounding and tranquility in this season of your life?',
    category: 'grounding',
    modeBias: 'all',
  },
  {
    id: 'p-16',
    text: 'What is a truth you want to remind your future self of when things feel noisy?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-17',
    text: 'What alignment are you seeking between your daily actions and your core values today?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-18',
    text: 'Notice the physical connection between your feet and the floor. What feels solid and supportive right now?',
    category: 'grounding',
    modeBias: 'all',
  },
  {
    id: 'p-19',
    text: 'Name one person, tool, or unseen system in the background of your life that makes your day easier.',
    category: 'gratitude',
    modeBias: 'all',
  },
  {
    id: 'p-20',
    text: 'If your current mood were a color, texture, or temperature, how would you describe it?',
    category: 'creativity',
    modeBias: '420',
  },
  {
    id: 'p-21',
    text: 'What is a recurring thought or pattern trying to tell you today?',
    category: 'reflection',
    modeBias: '1111',
  },
  {
    id: 'p-22',
    text: 'Close your eyes and isolate the furthest sound you can hear. What is it?',
    category: 'presence',
    modeBias: 'all',
  },
  {
    id: 'p-23',
    text: 'Take a deep inhale. What subtle aromas or thermal shifts are you sensing in the air?',
    category: 'presence',
    modeBias: '420',
  },
  {
    id: 'p-24',
    text: 'If the universe were listening right now, what clear, one-sentence request would you make?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-25',
    text: 'What is a small problem you recently reverse-engineered and solved that brought you quiet satisfaction?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-26',
    text: 'Imagine the roots of a tree anchoring into the soil. Where is your anchor right now?',
    category: 'grounding',
    modeBias: '420',
  },
  {
    id: 'p-27',
    text: 'Think of a small coincidence or synchronicity that surprised you recently. How did it make you feel?',
    category: 'gratitude',
    modeBias: '1111',
  },
  {
    id: 'p-28',
    text: 'What mental tab can you safely close right now to free up some internal bandwidth?',
    category: 'intention',
    modeBias: 'all',
  },
  {
    id: 'p-29',
    text: 'Let your mind wander without direction for sixty seconds. What unexpected connection or idea drifted in?',
    category: 'creativity',
    modeBias: '420',
  },
  {
    id: 'p-30',
    text: 'For the next sixty seconds, do nothing but watch the time pass. How does the pacing feel when you stop rushing?',
    category: 'presence',
    modeBias: '1111',
  },
  {
    id: 'p-31',
    text: 'What complex system in nature or technology have you paused to appreciate today?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-32',
    text: 'Focus on the physical structure of an object nearby. How does its geometry or design shape the space around it?',
    category: 'grounding',
    modeBias: '420',
  },
  {
    id: 'p-33',
    text: 'What boundary do you need to set right now to protect your peace and energy for the rest of the day?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-34',
    text: 'What is a specific piece of art, music, or media that deeply resonated with your spirit this week?',
    category: 'gratitude',
    modeBias: 'all',
  },
  {
    id: 'p-35',
    text: 'As you decompress, what heavy expectation are you willing to finally set down?',
    category: 'reflection',
    modeBias: '420',
  },
  {
    id: 'p-36',
    text: 'What is the absolute clearest thought in your mind at this exact synchronized moment?',
    category: 'presence',
    modeBias: '1111',
  },
  {
    id: 'p-37',
    text: 'Look out a window or step outside. What is one specific detail in the landscape or trail that catches your eye?',
    category: 'grounding',
    modeBias: 'all',
  },
  {
    id: 'p-38',
    text: 'Focus on a nearby source of heat or cooling. How does that thermal energy gently shift the atmosphere of the room?',
    category: 'presence',
    modeBias: '420',
  },
  {
    id: 'p-39',
    text: 'Think of a recent challenge. What foundational logic or underlying "why" helped you navigate it successfully?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-40',
    text: 'If you could plant a single seed of intention today to harvest months from now, what would you grow?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-41',
    text: 'Imagine the microscopic structures of the physical objects around you. What hidden complexity brings you awe?',
    category: 'creativity',
    modeBias: '420',
  },
  {
    id: 'p-42',
    text: 'Find an object with a distinct texture, like wood grain or stone. What history or process does its surface reveal?',
    category: 'grounding',
    modeBias: 'all',
  },
  {
    id: 'p-43',
    text: 'What underlying system or routine ran flawlessly today without you having to actively manage or troubleshoot it?',
    category: 'gratitude',
    modeBias: 'all',
  },
  {
    id: 'p-44',
    text: 'As the numbers align, what fragmented thoughts can you compile into a single, unified focus?',
    category: 'intention',
    modeBias: '1111',
  },
  {
    id: 'p-45',
    text: 'Notice the shift in your physical state when you deliberately slow your breathing. What subtle chemical or physical change do you feel?',
    category: 'presence',
    modeBias: '420',
  },
  {
    id: 'p-46',
    text: 'What is a skill or concept you have been quietly cultivating, bit by bit, behind the scenes?',
    category: 'reflection',
    modeBias: 'all',
  },
  {
    id: 'p-47',
    text: 'Who is someone whose distinct wavelength or energy perfectly complements your own?',
    category: 'gratitude',
    modeBias: '1111',
  },
  {
    id: 'p-48',
    text: 'Trace the journey of a deep breath from the atmosphere around you, down into your lungs, and back out.',
    category: 'grounding',
    modeBias: '420',
  },
  {
    id: 'p-49',
    text: 'If you were to map your current mental landscape as a physical environment, what would the terrain look like?',
    category: 'creativity',
    modeBias: 'all',
  },
  {
    id: 'p-50',
    text: 'Right now, at this synchronized minute, what is the most undeniable fact of your present reality?',
    category: 'presence',
    modeBias: '1111',
  },
  {
    id: 'p-51',
    text: 'What process of transformation—like heat changing the state of a material—are you currently experiencing in your life?',
    category: 'reflection',
    modeBias: '420',
  },
  {
    id: 'p-52',
    text: 'What unnecessary variable can you remove from your routine tomorrow to optimize your peace of mind?',
    category: 'intention',
    modeBias: 'all',
  },
  {
    id: 'p-53',
    text: 'Think of a distinct flavor or botanical aroma you experienced recently. What memory or sensation did it trigger?',
    category: 'gratitude',
    modeBias: '420',
  },
  {
    id: 'p-54',
    text: 'Notice gravity holding you exactly where you need to be. How does that constant, invisible physical force feel right now?',
    category: 'grounding',
    modeBias: '1111',
  },
  {
    id: 'p-55',
    text: 'What rigid rule or strict structure in your daily life could benefit from a little playful experimentation?',
    category: 'creativity',
    modeBias: 'all',
  },
  {
    id: 'p-56',
    text: 'Observe the way light is currently interacting with the surfaces around you. What shadows or reflections catch your eye?',
    category: 'presence',
    modeBias: 'all',
  },
  {
    id: 'p-57',
    text: 'When you observe the synchronization of time on the clock, what internal rhythm of your own feels most aligned?',
    category: 'reflection',
    modeBias: '1111',
  },
  {
    id: 'p-58',
    text: 'This one is for you, write whatever is on your mind right now',
    category: 'reflection',
    modeBias: '1111',
  },
];

/**
 * Get a random mindfulness prompt, optionally biased towards the active mode.
 */
export function getRandomPrompt(mode?: TrackerMode): MindfulnessPrompt {
  const candidates = MINDFULNESS_PROMPTS.filter((p) => {
    if (!mode) return true;
    return p.modeBias === 'all' || p.modeBias === mode;
  });

  const pool = candidates.length > 0 ? candidates : MINDFULNESS_PROMPTS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
