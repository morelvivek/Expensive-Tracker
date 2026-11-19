Expense Tracker

Frontend-only expense tracker built with HTML, CSS, and JavaScript. No server,
database, package manager, or build step is required. Tracker records and theme
preferences are stored in the current browser using localStorage; they are not
synced across browsers or devices. Use the JSON backup controls to move data.

Run locally
Open index.html in a browser.

Deploy to Render
1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Render, choose New > Blueprint and connect that repository. Render reads
	render.yaml and creates a Static Site.
3. Confirm the service settings:
	- Runtime: Static
	- Build command: echo "Static frontend; no build step required"
	- Publish directory: .
4. Create the Blueprint. Render will deploy the site and provide its public URL.

The build command does not compile anything; it satisfies Render's required
build-command field. The site itself is served from the repository root.
