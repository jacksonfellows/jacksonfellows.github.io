const N_COMMITS_PER_REPO = 5;
const N_MAX_COMMITS_DISPLAY = 7;
const CACHE_KEY = 'jf_github_recent_commits_cache';
const CACHE_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

async function get_recent_commits(repo) {
    const cache = localStorage.getItem(CACHE_KEY);
    const now = Date.now();
    const cacheData = JSON.parse(cache);
    
    // Check if cache exists and is still valid
    if (cache && repo in cacheData) {
        if (now < cacheData.timestamp + CACHE_EXPIRATION_TIME) {
            return cacheData.commits[repo] || [];
        }
    }

    // If cache is expired or not found, fetch from GitHub
    let response = await fetch(`https://api.github.com/repos/jacksonfellows/${repo}/commits?per_page=${N_COMMITS_PER_REPO}`);
    if (response.ok) {
        let j = await response.json();
        
        // Update cache with the new commits
        const updatedCache = cache ? JSON.parse(cache) : { commits: {} };
        updatedCache.commits[repo] = j;
        updatedCache.timestamp = now; // Set new timestamp
        localStorage.setItem(CACHE_KEY, JSON.stringify(updatedCache));

        return j;
    }
}

let updates_div;

function display_header() {
    let b = document.createElement("div");
    document.getElementById("box").appendChild(b);
    b.classList.add("updates_wrapper");
    updates_div = document.createElement("div");
    updates_div.classList.add("updates");
    b.appendChild(updates_div);
    let d = document.createElement("p");
    d.classList.add("ra");
    d.innerHTML = "Recent GitHub activity";
    updates_div.appendChild(d);
}

function display_last_commit(info) {
    if (!info) return;
    let commit_url = info["html_url"];
    let repo = commit_url.split("/")[4];
    let commit_message = info["commit"]["message"].split("\n")[0];
    let commit_timestamp = new Date(info["commit"]["author"]["date"]);
    let commit_timestring = commit_timestamp.toLocaleDateString("en-US", {month: "long", day: "numeric"});
    let d = document.createElement("div");
    d.classList.add("gh_section");
    d.classList.add("ci");
    d.innerHTML = `<a href="${commit_url}" style="text-decoration: none;"><img src="github_logo.svg" id="gh-logo"> <span class="ct">${commit_timestring}</span> <span class="cr">${repo}</span> ${commit_message}</a>`;
    updates_div.appendChild(d);
}

let repos = ["jacksonfellows.github.io", "euler", "aoc", "misc"];


async function load() {
    let commits = [];
    for (let repo of repos) {
        try {
            let recent_commits = await get_recent_commits(repo);
            commits = commits.concat(recent_commits);
        } catch (_) {}
    }
    if (commits.length > 0) {
        display_header();
        commits.sort((a, b) => new Date(b["commit"]["author"]["date"]) - new Date(a["commit"]["author"]["date"]));
        for (let i = 0; i < N_MAX_COMMITS_DISPLAY; i++) {
            display_last_commit(commits[i]);
        }
    }
}

window.onload = load;
