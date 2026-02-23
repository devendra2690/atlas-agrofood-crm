const rawWeight = 300;
const cmWastageIdx = 5; // e.g. Onion root wastage
const vWastageIdx = 9;  // e.g. White Onion variety wastage
const formYield = 15;   // e.g. Powder yield

const w1 = rawWeight * (1 - (cmWastageIdx / 100));
const w2 = w1 * (1 - (vWastageIdx / 100));
const finalOutputKg = w2 * (formYield / 100);

console.log("W1:", w1);
console.log("W2:", w2);
console.log("Final:", finalOutputKg);
