/** Pure: format total seconds as MM:SS with zero padding. */
export function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0')
  const ss = (clamped % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}
