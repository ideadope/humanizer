import { loadHumanizer } from "@ideadope/humanizer";

async function runTest() {
  try {
    console.log("Loading Wasm engine...");
    const humanize = await loadHumanizer();

    const input = "This is a robotic sentence\u200B created by an AI.";
    const output = humanize(input);

    console.log("Input:", input);
    console.log("Output:", output);
  } catch (err) {
    console.error("Engine failed to start:", err);
  }
}

runTest();
