import fs from 'fs'
import path from 'path'

const jsonPath = path.resolve('src/data/sasayai.json')
const cacheDir = path.resolve('.cache/sasayai')

console.log('Generating sasayai files from JSON...')

// Ensure cache dir exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true })
} else {
  // Clear cache dir if it exists
  const files = fs.readdirSync(cacheDir)
  for (const file of files) {
    fs.unlinkSync(path.join(cacheDir, file))
  }
}

// Read JSON
if (!fs.existsSync(jsonPath)) {
  console.error(`Source file not found: ${jsonPath}`)
  process.exit(1)
}

const rawData = fs.readFileSync(jsonPath, 'utf-8')
let data = []
try {
  data = JSON.parse(rawData)
} catch (e) {
  console.error(`Failed to parse JSON: ${e.message}`)
  process.exit(1)
}

// Generate MD files
data.forEach(item => {
  // Use ID as filename, fallback to timestamp if ID is missing
  const filename = `${item.id || Date.now()}.md`
  const content = `---
date: ${item.date}
id: "${item.id}"
---
${item.content}
`
  fs.writeFileSync(path.join(cacheDir, filename), content)
})

console.log(`Successfully generated ${data.length} sasayai files in .cache/sasayai/`)
