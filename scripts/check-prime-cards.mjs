import { ScenarioManager } from '../js/scenarioManager.js';

const sm = new ScenarioManager({level: 8});
const cards = sm.cardsFromIndices([5, 7, 11, 10, 6, 4, 12, 1]);

console.log('\nCards:');
cards.forEach((c, i) => {
  const cardIndex = [5, 7, 11, 10, 6, 4, 12, 1][i];
  console.log(`[${i}] Card #${cardIndex}: ${c.colors.join(', ')}`);
});

console.log('\nAvailable dice: red, green, green, gold, ∩, ′, U, ∅');
console.log('\nTesting which die′ gives 3 matching cards:');
['red', 'green', 'gold', 'U', '∅'].forEach(value => {
  let matches, matchIndices;
  if (value === 'U') {
    // U′ = complement of universe = null set (no cards match)
    matches = [];
    matchIndices = [];
  } else if (value === '∅') {
    // ∅′ = complement of null = universe (all cards match)
    matches = cards;
    matchIndices = cards.map((c, i) => i);
  } else {
    // Color complement
    matches = cards.filter(c => !c.colors.includes(value));
    matchIndices = cards.map((c, i) => !c.colors.includes(value) ? i : -1).filter(i => i >= 0);
  }
  console.log(`  ${value}′: ${matches.length} cards → indices ${matchIndices.join(', ')}`);
});

