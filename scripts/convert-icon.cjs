/* eslint-disable */
const { nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

const input = 'images/pomodoro-timer.jpg'
const output = 'build/icon.png'

if (!fs.existsSync('build')) {
  fs.mkdirSync('build', { recursive: true })
}

if (!fs.existsSync(input)) {
  console.error(`Error: ${input} not found`)
  process.exit(1)
}

const img = nativeImage.createFromPath(path.resolve(input))
fs.writeFileSync(output, img.toPNG())
console.log(`Converted ${input} → ${output}`)

// Gracefully exit — app may not be defined when running via ELECTRON_RUN_AS_NODE
if (typeof app !== 'undefined') {
  app.quit()
} else {
  process.exit(0)
}
