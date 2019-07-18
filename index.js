const { Toolkit } = require('actions-toolkit');
const fetch = require('node-fetch');

(async function() {
    const tools = new Toolkit({
        event: ['deployment_status'],
        secrets: ['GITHUB_TOKEN', 'HEROKU_AUTH_TOKEN']
    });

    // Only continue if this was a failure
    const deployState = tools.context.payload.deployment_status.state;
    if (deployState !== 'failure') {
        tools.exit.neutral(`Deploy was not a failure. Got '${deployState}'`);
    }

    const repoName = tools.context.payload.repository.name;
    const appName = tools.context.payload.deployment.environment;
    const issueNumber = appName.replace(`${repoName}-pr-`, '');

    // Fetch the latest build
    let build = await loadHerokuBuild(appName);

    // And the logs for that build (URL contains auth)
    let logResponse = await fetch(build.output_stream_url);
    const logText = await logResponse.text();

    // Create a comment on the issue with the logs
    let herokuLink = '<a href="https://dashboard.heroku.com/apps/'+appName+'/activity/">View on Heroku</a>';

    const issueDetails = {
        owner: tools.context.payload.repository.owner.login,
        repo: repoName,
        issue_number: issueNumber,
        body: herokuLink+"\n ```\n" + logText + "\n```"
    };

    await tools.github.issues.createComment(issueDetails)

    tools.exit.success("Logs posted");
})();

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
