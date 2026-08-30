import { evaluate } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

const rawModules = import.meta.glob('/book/**/*.mdx', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const partMeta = {
  '01-part': { number: 'I', title: 'Понимание AI', accent: 'green' },
  '02-part': { number: 'II', title: 'Работа с AI', accent: 'blue' },
  '03-part': { number: 'III', title: 'Как всё устроено', accent: 'orange' },
  '04-part': { number: 'IV', title: 'AI-агенты', accent: 'green-dark' },
}

const roman = (value) => ({ 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }[value] || String(value))

function stripMarkdown(value) {
  return value
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleFrom(raw, filePath) {
  const heading = raw.trimStart().match(/^#{1,6}\s+(.+)$/)?.[1]
  if (heading) return stripMarkdown(heading)
  return filePath.split('/').pop().replace(/\.mdx$/, '').replace(/^Часть [IVX]+\.\s*/, '')
}

function orderFor(filePath) {
  const fileName = filePath.split('/').pop()
  if (/введени/i.test(fileName)) return 0
  if (/заключени/i.test(fileName)) return 99
  const match = fileName.match(/Глава\s+(\d+)/i) || fileName.match(/Задача\s+(\d+)/i)
  return match ? Number(match[1]) : 50
}

function slugify(value) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/(^-|-$)/g, '')
}

function extractHeadings(raw) {
  return [...raw.matchAll(/^(#{2,4})\s+(.+)$/gm)].map((match, index) => ({
    id: slugify(match[2]) || `section-${index}`,
    text: stripMarkdown(match[2]),
    level: match[1].length,
  }))
}

function excerptFrom(raw) {
  const text = raw
    .replace(/^#{1,6}\s+.*$/gm, '')
    .replace(/^```[\s\S]*?```$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .split('\n')
    .map(stripMarkdown)
    .find((line) => line.length > 45)
  return text || 'Практическая глава о том, как думать, проектировать и собирать AI-системы.'
}

export const documents = Object.entries(rawModules)
  .map(([filePath, raw]) => {
    const parts = filePath.split('/')
    const folder = parts[2] || '01-part'
    const meta = partMeta[folder] || { number: roman(Number(folder) || 1), title: folder, accent: 'green' }
    const title = titleFrom(raw, filePath)
    return {
      id: slugify(`${folder}-${filePath}`),
      filePath,
      raw,
      title,
      part: meta,
      folder,
      order: orderFor(filePath),
      headings: extractHeadings(raw),
      excerpt: excerptFrom(raw),
      isTask: /Задача/i.test(filePath),
    }
  })
  .sort((a, b) => a.folder.localeCompare(b.folder) || Number(a.isTask) - Number(b.isTask) || a.order - b.order || a.filePath.localeCompare(b.filePath, 'ru'))

export const parts = Object.values(
  documents.reduce((result, document) => {
    if (!result[document.folder]) result[document.folder] = { ...document.part, folder: document.folder, documents: [] }
    result[document.folder].documents.push(document)
    return result
  }, {}),
)

export const firstDocument = documents[0]
export const lastDocument = documents.at(-1)

export async function compileDocument(document) {
  const source = /^#{1,6}\s+/.test(document.raw) ? document.raw.replace(/^#{1,6}\s+.*(?:\r?\n){1,2}/, '') : document.raw
  const evaluated = await evaluate(source, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  })
  return evaluated.default
}

export function findDocument(id) {
  return documents.find((document) => document.id === id)
}
