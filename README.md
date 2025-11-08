# Structurizr Exporter

**Automatically export Structurizr architecture diagrams to SVG format**

Perfect for keeping your documentation up-to-date! This GitHub Action takes your Structurizr DSL files and generates beautiful SVG diagrams that can be embedded in your README, wikis, or documentation sites.

## Quick Start

```yaml
- name: Export architecture diagrams
  uses: heavywater-dev/structurizr-exporter@v1
```

That's it! The action will find your Structurizr files in `docs/structurizr/` and output SVG diagrams to `docs/images/`.

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

## Complete Example

```yaml
name: Update Architecture Diagrams

on:
  push:
    paths: ['docs/structurizr/**']
  pull_request:
    paths: ['docs/structurizr/**']

permissions:
  contents: write
jobs:
  generate-diagrams:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Export architecture diagrams
        uses: heavywater-dev/structurizr-exporter@v1
        with:
          structurizr-path: docs/structurizr
          output-path: docs/images

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Support

- [Structurizr Documentation](https://docs.structurizr.com/)
- [Report Issues](https://github.com/heavywater-dev/structurizr-exporter/issues)
- [Discussions](https://github.com/heavywater-dev/structurizr-exporter/discussions)
