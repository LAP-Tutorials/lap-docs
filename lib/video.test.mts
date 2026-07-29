import assert from "node:assert/strict";
import test from "node:test";
import {
  extractYouTubeEmbedId,
  extractYouTubeId,
  removeYouTubeIframe,
} from "./video.ts";

test("normalizes and removes the selected YouTube embed", () => {
  const videoId = "6JgkhKIoFOA";
  const iframe = `<iframe src="https://www.youtube.com/embed/${videoId}?si=test" title="YouTube video player"></iframe>`;
  const html = `${iframe}<p>Keep the guide.</p>${iframe}`;

  assert.equal(extractYouTubeEmbedId(iframe), videoId);
  assert.equal(extractYouTubeId(`https://youtu.be/${videoId}`), videoId);
  assert.equal(
    extractYouTubeEmbedId(
      `<p>See https://youtube.com/watch?v=${videoId} for more.</p>`,
    ),
    undefined,
  );
  assert.equal(
    extractYouTubeId(`https://notyoutube.com/embed/${videoId}`),
    undefined,
  );
  assert.equal(
    extractYouTubeId(`https://evil-youtube.com/embed/${videoId}`),
    undefined,
  );
  assert.equal(
    extractYouTubeEmbedId(
      `<iframe src="https://www.youtube.com/embed/${videoId}X"></iframe>`,
    ),
    undefined,
  );
  assert.equal(removeYouTubeIframe(html, videoId), `<p>Keep the guide.</p>`);

  const otherVideoId = "5zlE8KEz6wk";
  const otherIframe = `<iframe src="https://www.youtube.com/embed/${otherVideoId}"></iframe>`;
  assert.equal(
    removeYouTubeIframe(`${iframe}${otherIframe}`, otherVideoId),
    iframe,
  );
});
