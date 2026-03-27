#!/usr/bin/env node

import fs from 'fs'

function escapeHtml(value = '') {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/* eslint-disable no-console */
console.log('Generating GitHub page...')

const now = new Date()

const day = String(now.getDate()).padStart(2, '0')
const monthLong = new Intl.DateTimeFormat('en', {month: 'long'}).format(now)
const year = now.getFullYear()

const formattedDate = `${day}-${monthLong}-${year}`

fs.rmSync('gh_page', {recursive: true, force: true})
fs.mkdirSync('gh_page', {recursive: true})

fs.cpSync('.github/page', 'gh_page', {recursive: true})
fs.cpSync('build', 'gh_page/files', {recursive: true})

let releaseFiles = [], devFiles = []

if (fs.existsSync('build/release')) {
    releaseFiles = fs
        .readdirSync('build/release', {withFileTypes: true})
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
}

if (fs.existsSync('build/dev')) {
    devFiles = fs
        .readdirSync('build/dev', {withFileTypes: true})
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
}

const metaFile = releaseFiles.filter(fileName => fileName.endsWith('.meta.js'))[0]
let version = 'n/a'
if (metaFile) {
    const meta = fs.readFileSync(`build/release/${metaFile}`, 'utf8')
    const match = meta.match(/^\s*\/\/\s*@version\s+(.+)$/m)
    version = match ? match[1].trim() : 'n/a'
}

const devMetaFile = devFiles.filter(fileName => fileName.endsWith('.meta.js'))[0]
let betaVersion = null
if (devMetaFile) {
    const meta = fs.readFileSync(`build/dev/${devMetaFile}`, 'utf8')
    const match = meta.match(/^\s*\/\/\s*@version\s+(.+)$/m)
    betaVersion = match ? match[1].trim() : null
}

const pluginData = JSON.parse(
    fs.readFileSync('plugin.json', 'utf8'),
)

let releaseLinks = []
if (releaseFiles.length > 0) {
    releaseLinks = releaseFiles
        .filter(name => !name.endsWith('meta.js'))
        .map(name => `<li><a href="files/release/${name}">${name}</a></li>`)
        .join('\n')

} else {
    releaseLinks = '<li>No release yet</li>'
}

const devLinks = devFiles
    .filter(name => !name.endsWith('meta.js'))
    .map(name => `<li><a href="files/dev/${name}">${name}</a></li>`)
    .join('\n')

let template = fs.readFileSync('gh_page/index.html', 'utf8')

const projectName = pluginData.name.replace('IITC plugin: ', '')

const raw = fs.readFileSync('build/changelog.json', 'utf8')
const tags = JSON.parse(raw);
const changelog = tags.map(tag => `
      <tr>
        <td><span class="badge text-bg-primary">${escapeHtml(tag.name)}</span></td>
        <td><span class="badge text-bg-secondary">${escapeHtml(tag.date)}</span></td>
        <td><pre class="changelog">${escapeHtml(tag.message)}</pre></td>
      </tr>
  `).join('')

let coverageSummary = '<p>No coverage report available.</p>'
if (fs.existsSync('coverage/coverage-summary.json')) {
    const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'))
    const total = summary.total
    const fmt = (metric) => {
        const pct = metric.pct.toFixed(1)
        const color = metric.pct >= 80 ? '#4caf50' : metric.pct >= 60 ? '#ff9800' : '#f44336'
        return `<td style="color:${color};font-weight:bold">${pct}%</td><td style="opacity:.7">${metric.covered}/${metric.total}</td>`
    }
    coverageSummary = `
<table class="changelog-table">
  <thead>
    <tr><th>Metric</th><th>Coverage</th><th>Covered/Total</th></tr>
  </thead>
  <tbody>
    <tr><td>Statements</td>${fmt(total.statements)}</tr>
    <tr><td>Branches</td>${fmt(total.branches)}</tr>
    <tr><td>Functions</td>${fmt(total.functions)}</tr>
    <tr><td>Lines</td>${fmt(total.lines)}</tr>
  </tbody>
</table>
<p><a href="coverage/">Full coverage report &rarr;</a></p>`
}

template = template
    .replace('{{RELEASE_LINKS}}', releaseLinks)
    .replace('{{DEV_LINKS}}', devLinks)
    .replaceAll('{{PROJECT_NAME}}', projectName)
    .replaceAll('{{PROJECT_VERSION}}', version)
    .replaceAll('{{LAST_UPDATED}}', formattedDate)
    .replace('{{PROJECT_DESCRIPTION}}', pluginData.description)
    .replace('{{CHANGELOG}}', changelog)
    .replace('{{COVERAGE_SUMMARY}}', coverageSummary)

fs.writeFileSync('gh_page/index.html', template, 'utf8')

const publishedAt = tags.length > 0 ? tags[0].date : ''

const devUserJsFile = devFiles.find(fileName => fileName.endsWith('.user.js') && !fileName.endsWith('.meta.js'))
const baseUrl = pluginData.downloadURL ? pluginData.downloadURL.replace(/\/files\/release\/[^/]+$/, '') : null
const betaDownloadURL = devUserJsFile && baseUrl ? `${baseUrl}/files/dev/${devUserJsFile}` : null

const publishedPluginData = {
    ...pluginData,
    version: version === 'n/a' ? undefined : version,
    publishedAt,
    ...(betaVersion && {betaVersion, betaDownloadURL, betaPublishedAt: formattedDate}),
}
fs.writeFileSync('gh_page/plugin.json', JSON.stringify(publishedPluginData, null, 2), 'utf8')

console.log('Finished =;)')
