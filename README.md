# Heroku Build Logs

Attach Heroku build logs on deployment failure

## Usage

```yaml
name: Heroku Build Logs
on: deployment_status

jobs:
  heroku-build-logs:
    name: Heroku Build Logs
    runs-on: ubuntu-latest
    steps:
      - name: Heroku Build Logs
        uses: mheap/github-action-heroku-logs@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          HEROKU_AUTH_TOKEN: ${{ secrets.HEROKU_AUTH_TOKEN }}
```

## Available Configuration

### Environment Variables

| Name              | Description                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| GITHUB_TOKEN      | The GitHub auth token, used to authenticate API requests. Use the value provided in `${{ secrets.GITHUB_TOKEN }}` |
| HEROKU_AUTH_TOKEN | Your Heroku API key. Used to fetch build logs                                                                     |
