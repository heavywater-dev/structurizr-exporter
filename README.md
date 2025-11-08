# Structurizr Exporter

GitHub Action for automatically exporting Structurizr diagrams to SVG format.

## Usage

```yaml
- name: Export Structurizr diagrams
  uses: heavywater-dev/structurizr-exporter@v1
  with:
    structurizr-path: docs/structurizr # folder with .dsl files
    output-path: docs/images # folder for SVG files
    structurizr-version: latest # Structurizr Lite version
```

## Inputs

| Input                 | Description                               | Default             |
| --------------------- | ----------------------------------------- | ------------------- |
| `structurizr-path`    | Path to folder with Structurizr workspace | `docs/structurizr/` |
| `output-path`         | Folder to save SVG files                  | `docs/images/`      |
| `structurizr-version` | Structurizr Lite Docker image version     | `latest`            |

## Example workflow

```yaml
name: Generate Architecture Diagrams

on:
  push:
    paths: ['docs/structurizr/**']

jobs:
  export-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Export diagrams
        uses: heavywater-dev/structurizr-exporter@v1

      - name: Commit generated diagrams
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/images/
          git diff --staged --quiet || git commit -m "Update architecture diagrams"
          git push
```

## How it works

1. Automatically installs required Playwright browsers (Chromium)
2. Starts Structurizr Lite in a Docker container
3. Loads your workspace from the specified folder
4. Uses Playwright to export each diagram to SVG
5. Saves files to the specified folder

## Requirements

- `workspace.dsl` or `workspace.json` file in the `structurizr-path` folder
- Docker available in runner environment (included in GitHub-hosted runners)
- No additional setup required - Playwright browsers install automatically
