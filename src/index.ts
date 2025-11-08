import * as core from '@actions/core'
import { exec } from '@actions/exec'
import fs from 'fs/promises'
import path from 'path'
import { chromium } from 'playwright'

async function ensurePlaywrightBrowsers() {
	try {
		core.startGroup('Installing Playwright browsers')
		core.info('Checking and installing Chromium browser...')
		await exec('npx', ['playwright', 'install', 'chromium', '--with-deps'])
		core.endGroup()
	} catch (error) {
		core.warning('Failed to install Playwright browsers, trying to continue...')
		throw error
	}
}

async function waitForStructurizr() {
	for (let i = 0; i < 30; i++) {
		try {
			const res = await fetch('http://localhost:8080')
			if (res.ok) return
		} catch {}
		await new Promise(r => setTimeout(r, 2000))
	}
	throw new Error('Timeout waiting for Structurizr Lite to start')
}

async function exportDiagrams(outputDir: string) {
	const browser = await chromium.launch({ headless: true })
	const page = await browser.newPage()

	core.info('Opening Structurizr Lite in browser...')
	await page.goto('http://localhost:8080', { waitUntil: 'networkidle' })

	const diagrams = await page.evaluate(
		() =>
			(window as any).structurizr?.scripting
				?.getViews()
				?.map((v: any) => v.key) || []
	)

	if (diagrams.length === 0) {
		throw new Error('No diagrams found in Structurizr workspace')
	}

	await fs.mkdir(outputDir, { recursive: true })

	let successCount = 0
	const failed: string[] = []

	for (const key of diagrams) {
		core.info(`Exporting diagram: ${key}`)
		await page.evaluate(
			k => (window as any).structurizr.scripting.changeView(k),
			key
		)
		await page.waitForTimeout(500)

		const svg = await page.evaluate(() =>
			(window as any).structurizr.scripting.exportCurrentDiagramToSVG({
				includeMetadata: true,
			})
		)

		if (svg) {
			await fs.writeFile(path.join(outputDir, `${key}.svg`), svg)
			successCount++
		} else {
			failed.push(key)
		}
	}

	await browser.close()

	if (failed.length > 0) {
		core.warning(
			`Failed to export ${failed.length} diagrams: ${failed.join(', ')}`
		)
	}

	core.info(`Successfully exported ${successCount} diagrams to ${outputDir}`)
}

async function main() {
	const structurizrPath =
		core.getInput('structurizr-path') || 'docs/structurizr'
	const outputPath = core.getInput('output-path') || 'docs/images'
	const structurizrVersion = core.getInput('structurizr-version') || 'latest'

	try {
		await ensurePlaywrightBrowsers()

		core.startGroup('Starting Structurizr Lite')
		await exec('docker', [
			'run',
			'-d',
			'--rm',
			'-p',
			'8080:8080',
			'-v',
			`${process.cwd()}/${structurizrPath}:/usr/local/structurizr`,
			`structurizr/lite:${structurizrVersion}`,
		])
		core.endGroup()

		await waitForStructurizr()

		core.startGroup('Exporting diagrams')
		await exportDiagrams(outputPath)
		core.endGroup()
	} catch (err: any) {
		core.setFailed(err.message)
	} finally {
		core.startGroup('Stopping Structurizr Lite')
		try {
			await exec('bash', [
				'-c',
				'docker stop $(docker ps -q --filter ancestor=structurizr/lite) || true',
			])
		} catch {
			core.warning('Failed to stop Structurizr container, but continuing')
		}
		core.endGroup()
	}
}

main()
