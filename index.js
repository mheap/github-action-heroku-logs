const { Toolkit } = require('actions-toolkit');
const fetch = require('node-fetch');

const tools = new Toolkit({
  event: ['issue_comment'],
  secrets: ['GITHUB_TOKEN', 'HEROKU_AUTH_TOKEN']
});

const repoName = tools.context.payload.repository.name;
const issueNumber = tools.context.payload.issue.number;
const isPr = tools.context.payload.issue.pull_request ? true : false;

tools.command('heroku-build-logs', async () => {
    // By default we assume it's a commit on the repo name
    let appName = repoName;

    // If it's a PR the app name contains the PR number
    if (isPr) {
        appName += '-pr-' + issueNumber;
    }

    // Fetch the latest build
    let build = await loadHerokuBuild(appName);
    // And the logs for that build (URL contains auth)
    let logResponse = await fetch(build.output_stream_url);
    const logText = await logResponse.text();

    // Create a comment on the issue with the logs
    let herokuLink = '<a href="https://dashboard.heroku.com/apps/'+appName+'/activity/releases/'+build.release.id+'">'+build.release.id+'</a>';

    const issueDetails = tools.context.issue;
    issueDetails['body'] = "Logs for "+herokuLink+"\n ```\n" + logText + "\n```";
    await tools.github.issues.createComment(issueDetails)
});

async function loadHerokuBuild(repoName) {
    const resp = await fetch(`https://api.heroku.com/apps/${repoName}/builds`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.HEROKU_AUTH_TOKEN}`,
            Accept: 'application/vnd.heroku+json; version=3',
            "Content-Type": "application/json; charset=UTF-8",
            Range: 'created_at; order=desc, max=1;'
        }
    });

    const firstBuild = (await resp.json())[0];
    return firstBuild;
}
