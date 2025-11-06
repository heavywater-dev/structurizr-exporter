"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec_1 = require("@actions/exec");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const playwright_1 = require("playwright");
async function waitForStructurizr() {
    for (let i = 0; i < 30; i++) {
        try {
            const res = await fetch('http://localhost:8080');
            if (res.ok)
                return;
        }
        catch { }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Timeout waiting for Structurizr Lite to start');
}
async function exportDiagrams(outputDir) {
    const browser = await playwright_1.chromium.launch({ headless: true });
    const page = await browser.newPage();
    core.info('Opening Structurizr Lite in browser...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    const diagrams = await page.evaluate(() => window.structurizr?.scripting
        ?.getViews()
        ?.map((v) => v.key) || []);
    if (diagrams.length === 0) {
        throw new Error('No diagrams found in Structurizr workspace');
    }
    await promises_1.default.mkdir(outputDir, { recursive: true });
    let successCount = 0;
    const failed = [];
    for (const key of diagrams) {
        core.info(`Exporting diagram: ${key}`);
        await page.evaluate(k => window.structurizr.scripting.changeView(k), key);
        await page.waitForTimeout(500);
        const svg = await page.evaluate(() => window.structurizr.scripting.exportCurrentDiagramToSVG({
            includeMetadata: true,
        }));
        if (svg) {
            await promises_1.default.writeFile(path_1.default.join(outputDir, `${key}.svg`), svg);
            successCount++;
        }
        else {
            failed.push(key);
        }
    }
    await browser.close();
    if (failed.length > 0) {
        core.warning(`Failed to export ${failed.length} diagrams: ${failed.join(', ')}`);
    }
    core.info(`Successfully exported ${successCount} diagrams to ${outputDir}`);
}
async function main() {
    const structurizrPath = core.getInput('structurizr-path') || 'docs/structurizr';
    const outputPath = core.getInput('output-path') || 'docs/images';
    const structurizrVersion = core.getInput('structurizr-version') || 'latest';
    try {
        core.startGroup('Starting Structurizr Lite');
        await (0, exec_1.exec)('docker', [
            'run',
            '-d',
            '--rm',
            '-p',
            '8080:8080',
            '-v',
            `${process.cwd()}/${structurizrPath}:/usr/local/structurizr`,
            `structurizr/lite:${structurizrVersion}`,
        ]);
        core.endGroup();
        await waitForStructurizr();
        core.startGroup('Exporting diagrams');
        await exportDiagrams(outputPath);
        core.endGroup();
    }
    catch (err) {
        core.setFailed(err.message);
    }
    finally {
        core.startGroup('Stopping Structurizr Lite');
        try {
            await (0, exec_1.exec)('bash', [
                '-c',
                'docker stop $(docker ps -q --filter ancestor=structurizr/lite) || true',
            ]);
        }
        catch {
            core.warning('Failed to stop Structurizr container, but continuing');
        }
        core.endGroup();
    }
}
main();
