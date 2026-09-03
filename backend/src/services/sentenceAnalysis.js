const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Output schema ─────────────────────────────────────────────────────────────

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['grammar_score', 'vocabulary_score', 'clarity_score', 'overall_score',
             'issues', 'suggestions', 'improved_sentence', 'ideal_sentence'],
  properties: {
    grammar_score:     { type: 'integer', description: 'Grammar correctness 1-10. 10 = flawless.' },
    vocabulary_score:  { type: 'integer', description: 'Vocabulary richness and appropriateness 1-10.' },
    clarity_score:     { type: 'integer', description: 'Clarity and completeness of the description 1-10.' },
    overall_score:     { type: 'integer', description: 'Weighted: grammar×0.4 + vocabulary×0.3 + clarity×0.3, rounded.' },
    issues:            { type: 'array', items: { type: 'string' }, description: '2-4 specific problems. Empty array if none.' },
    suggestions:       { type: 'array', items: { type: 'string' }, description: '2-4 actionable improvement suggestions.' },
    improved_sentence: { type: 'string', description: "Student's sentence corrected, preserving their intent." },
    ideal_sentence:    { type: 'string', description: 'Best possible description using the reference and hints.' },
  },
};

// ── Prompt templates ──────────────────────────────────────────────────────────

const SYSTEM = `You are an expert English language teacher evaluating a student's written description of a short video scene.

Scoring guide:
  10  — native-level fluency, no errors
  8-9 — very good, only minor imperfections
  6-7 — competent, noticeable room for improvement
  4-5 — basic, several errors that affect communication
  1-3 — significant errors, meaning is unclear

Rules:
- issues: real mistakes only, max 4. Empty array if none.
- suggestions: actionable and specific to this student's text, max 4.
- improved_sentence: fix errors, keep the student's intent and vocabulary level.
- ideal_sentence: best possible description using the reference and any hints.
- overall_score = round(grammar×0.4 + vocabulary×0.3 + clarity×0.3).
- All scores must be integers 1-10.`;

function buildPrompt(scene) {
  const { title, student_response, reference_description,
          additional_notes, difficulty, vocabularies, grammars } = scene;

  const parts = [
    `Scene title: "${title}"`,
    `Difficulty: ${difficulty || 'intermediate'}`,
  ];

  if (reference_description) {
    parts.push('', `Reference description (ideal answer):\n"${reference_description}"`);
  }
  if (additional_notes) {
    parts.push('', `Teaching notes:\n${additional_notes}`);
  }
  if (Array.isArray(vocabularies) && vocabularies.length) {
    const words = vocabularies
      .filter(v => v.word)
      .map(v => `  • ${v.word}${v.part_of_speech ? ` (${v.part_of_speech})` : ''}: ${v.definition}${v.example ? ` — e.g. "${v.example}"` : ''}`);
    if (words.length) parts.push('', 'Key vocabulary:', ...words);
  }
  if (Array.isArray(grammars) && grammars.length) {
    const patterns = grammars
      .filter(g => g.pattern)
      .map(g => `  • ${g.pattern}: ${g.explanation}${g.example ? ` — e.g. "${g.example}"` : ''}`);
    if (patterns.length) parts.push('', 'Grammar focus:', ...patterns);
  }

  parts.push('', `Student response:\n"${student_response}"`, '', 'Evaluate this response and provide structured feedback.');
  return parts.join('\n');
}

// ── Chain: prompt → GPT-4o (structured output) → typed result ─────────────────

async function analyseSentence(scene) {
  if (!scene.student_response?.trim()) throw new Error('student_response is required');

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'user',   content: buildPrompt(scene) },
  ];

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'feedback', strict: true, schema: SCHEMA },
      },
    });

    const raw = JSON.parse(response.choices[0].message.content);

    return {
      grammar_score:     clamp(raw.grammar_score),
      vocabulary_score:  clamp(raw.vocabulary_score),
      clarity_score:     clamp(raw.clarity_score),
      overall_score:     clamp(raw.overall_score),
      issues:            (raw.issues      || []).slice(0, 4),
      suggestions:       (raw.suggestions || []).slice(0, 4),
      improved_sentence: raw.improved_sentence || scene.student_response,
      ideal_sentence:    raw.ideal_sentence    || scene.reference_description || scene.student_response,
    };
  } catch (err) {
    console.error('[sentenceAnalysis] GPT-4o failed:', err.message);
    return fallback(scene);
  }
}

function clamp(n) {
  return Math.max(1, Math.min(10, Math.round(Number(n)) || 5));
}

function fallback(scene) {
  return {
    grammar_score: 6, vocabulary_score: 6, clarity_score: 6, overall_score: 6,
    issues:            ['AI analysis unavailable — please try again.'],
    suggestions:       ['Focus on using the correct verb tense when describing actions.'],
    improved_sentence: scene.student_response,
    ideal_sentence:    scene.reference_description || scene.student_response,
  };
}

module.exports = { analyseSentence };
