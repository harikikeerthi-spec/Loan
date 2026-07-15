const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSopAnalysis } = require('./sopAnalysisFormatter');

test('normalizes backend categories and weak areas into UI-safe values', () => {
  const result = normalizeSopAnalysis({
    totalScore: 82,
    humanizeScore: 88,
    plagiarismScore: 12,
    categories: [
      { name: 'Clarity', score: 16, weight: 0.2 },
      { name: 'Financial Justification', score: 14, weight: 0.2 },
    ],
    weakAreas: [
      { issue: 'Needs stronger evidence', recommendation: 'Add concrete examples' },
    ],
  });

  assert.equal(result.score, 82);
  assert.equal(result.humanScore, 88);
  assert.equal(result.originalityScore, 12);
  assert.deepEqual(result.categories, {
    Clarity: 16,
    'Financial Justification': 14,
  });
  assert.deepEqual(result.weakAreas, ['Add concrete examples']);
});

test('falls back to a string array when weak areas are already plain strings', () => {
  const result = normalizeSopAnalysis({
    score: 77,
    humanScore: 75,
    originalityScore: 18,
    categories: {
      Clarity: 15,
      Structure: 12,
    },
    weakAreas: ['Be more specific', 'Show clearer career goals'],
  });

  assert.equal(result.score, 77);
  assert.deepEqual(result.weakAreas, ['Be more specific', 'Show clearer career goals']);
});
