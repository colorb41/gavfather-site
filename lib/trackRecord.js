import fs from 'fs'
import path from 'path'

/**
 * Load published track-record stats for About / homepage proof.
 */
export function getTrackRecord() {
  const file = path.join(process.cwd(), 'public', 'data', 'track-record.json')
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}
