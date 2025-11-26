import fs from 'fs/promises'
import path from 'path'
import { chromium } from 'playwright'

const structurizrPath = process.env.INPUT_STRUCTURIZR_PATH || 'docs/structurizr'
const outputPath = process.env.INPUT_OUTPUT_PATH || 'docs/images'

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

	console.log('Opening Structurizr Lite in browser...')
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
		console.log(`Exporting diagram: ${key}`)
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
		console.warn(
			`Failed to export ${failed.length} diagrams: ${failed.join(', ')}`
		)
	}

	console.log(`Successfully exported ${successCount} diagrams to ${outputDir}`)
}

async function main() {
	try {
		await waitForStructurizr()
		await exportDiagrams(outputPath)
	} catch (err: any) {
		console.error(err.message)
		process.exit(1)
	}
}

main()
