/**
 * Modular Chunking Service
 *
 * Configurable initial defaults:
 * - Chunk size: ~600 characters (range 500–700)
 * - Chunk overlap: ~120 characters (range 100–150)
 *
 * Note: These values are initial baseline defaults, not empirically optimized.
 */

const DEFAULT_CHUNK_SIZE = 600;
const DEFAULT_CHUNK_OVERLAP = 120;

/**
 * Splits raw post content into sequential chunks.
 *
 * @param {string} content - Raw content of the post
 * @param {object} options - Optional chunking parameters
 * @param {number} options.chunkSize - Target maximum chunk length
 * @param {number} options.chunkOverlap - Overlap length between consecutive chunks
 * @returns {Array<{ chunk_text: string, chunk_index: number }>}
 */
function createChunks(content, options = {}) {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const chunkOverlap = options.chunkOverlap || DEFAULT_CHUNK_OVERLAP;

  const text = (content || '').trim();
  if (!text) {
    return [];
  }

  // Short post handling: keep as a single chunk without redundant splitting
  if (text.length <= chunkSize) {
    return [{ chunk_text: text, chunk_index: 0 }];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // If remaining text fits in one chunk, finish up
    if (endIndex >= text.length) {
      const lastChunk = text.slice(startIndex).trim();
      if (lastChunk.length > 0) {
        chunks.push({ chunk_text: lastChunk, chunk_index: chunkIndex++ });
      }
      break;
    }

    // Identify the best natural semantic boundary within the candidate window
    const searchSlice = text.slice(startIndex, endIndex);
    let splitPos = -1;

    // 1. Paragraph boundary
    const paraIdx = searchSlice.lastIndexOf('\n\n');
    if (paraIdx > chunkSize * 0.4) {
      splitPos = startIndex + paraIdx + 2;
    }

    // 2. Line break
    if (splitPos === -1) {
      const lineIdx = searchSlice.lastIndexOf('\n');
      if (lineIdx > chunkSize * 0.4) {
        splitPos = startIndex + lineIdx + 1;
      }
    }

    // 3. Sentence boundary (. ! ?)
    if (splitPos === -1) {
      const sentenceMatch = searchSlice.match(/.*[.!?]\s+/s);
      if (sentenceMatch && sentenceMatch[0].length > chunkSize * 0.4) {
        splitPos = startIndex + sentenceMatch[0].length;
      }
    }

    // 4. Word boundary (space)
    if (splitPos === -1) {
      const spaceIdx = searchSlice.lastIndexOf(' ');
      if (spaceIdx > chunkSize * 0.4) {
        splitPos = startIndex + spaceIdx + 1;
      } else {
        splitPos = endIndex; // Fallback hard boundary
      }
    }

    const chunkRaw = text.slice(startIndex, splitPos).trim();
    if (chunkRaw.length > 0) {
      chunks.push({ chunk_text: chunkRaw, chunk_index: chunkIndex++ });
    }

    // Advance startIndex accounting for overlap
    startIndex = Math.max(splitPos - chunkOverlap, startIndex + 1);

    // Snap overlap forward to the next whitespace boundary to prevent chopping words
    if (startIndex < text.length && text[startIndex] !== ' ' && text[startIndex - 1] !== ' ') {
      const nextSpace = text.indexOf(' ', startIndex);
      if (nextSpace !== -1 && nextSpace - startIndex < 30) {
        startIndex = nextSpace + 1;
      }
    }
  }

  return chunks;
}

module.exports = {
  createChunks,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP,
};
