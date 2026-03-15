/**
 * Get color for aurora probability using a gradient scale.
 * Low probability -> Blue
 * Medium probability -> Green
 * High probability -> Purple
 * 
 * @param {number} probability - Aurora probability (0-100)
 * @returns {Array} RGB color array [r, g, b]
 */
export function getAuroraColor(probability) {
  // Normalize probability to 0-1
  const normalized = Math.min(100, Math.max(0, probability)) / 100

  if (normalized < 0.33) {
    // Low: Blue (0, 100, 255) to Cyan (0, 255, 255)
    const t = normalized / 0.33
    return [
      0,
      Math.round(100 + (155 * t)),
      255
    ]
  } else if (normalized < 0.66) {
    // Medium: Cyan (0, 255, 255) to Green (0, 255, 100)
    const t = (normalized - 0.33) / 0.33
    return [
      0,
      255,
      Math.round(255 - (155 * t))
    ]
  } else {
    // High: Green (0, 255, 100) to Purple (200, 0, 255)
    const t = (normalized - 0.66) / 0.34
    return [
      Math.round(200 * t),
      Math.round(255 * (1 - t)),
      Math.round(100 + (155 * t))
    ]
  }
}

/**
 * Get color with alpha for aurora probability.
 * 
 * @param {number} probability - Aurora probability (0-100)
 * @param {number} alpha - Alpha value (0-255), default 180
 * @returns {Array} RGBA color array [r, g, b, a]
 */
export function getAuroraColorWithAlpha(probability, alpha = 180) {
  const [r, g, b] = getAuroraColor(probability)
  return [r, g, b, alpha]
}

/**
 * Get intensity weight for heatmap based on probability.
 * 
 * @param {number} probability - Aurora probability (0-100)
 * @returns {number} Weight value (0-1)
 */
export function getAuroraWeight(probability) {
  // Exponential scaling to emphasize high probabilities
  return Math.pow(probability / 100, 1.5)
}
