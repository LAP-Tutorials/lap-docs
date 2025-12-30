import { processMarkdown } from "./lib/markdown";

const sampleMarkdown = `
# Hello World
This is a paragraph.

## Subheading with **Bold**
- List item 1
`;

async function test() {
  try {
    console.log("Processing markdown...");
    const html = await processMarkdown(sampleMarkdown);
    console.log("Success! HTML length:", html.length);
  } catch (err) {
    console.error("CRASH DETECTED:");
    console.error(err);
    process.exit(1);
  }
}

test();
