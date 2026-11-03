import { readFile as readFileCb, writeFile as writeFileCb } from 'node:fs/promises'

export async function readFile(path) {
  return readFileCb(path, 'utf8')
}

export async function readFileSafe(path, fallback = '') {
  try {
    return await readFileCb(path, 'utf8')
  } catch {
    return fallback
  }
}

export async function writeFile(path, content) {
  await writeFileCb(path, content, 'utf8')
}
