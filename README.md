# sashimi-tampopo: automatic refactoring tool powered by LLM

## Usage

The `ANTHROPIC_API_KEY` environment variable must be set to use this tool.

```bash
sashimi-tanpopo
  --revision <revision> \ # you may omit this option if you use the latest revision of the example
  --example src/refactored-example \
  --note 'additional instructions' \
  [--dry-run] \
  src/file-to-refactor-1 src/file-to-refactor-2 ...
```

This command gets the last change made to `src/refactored-example` via Git, then attempts to apply the same change to `src/file-to-refactor` using Anthropic Claude.
