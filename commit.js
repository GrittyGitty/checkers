const github = document.getElementById("github");
const { headDuringBuild } = github.dataset;
const LATEST = document.createTextNode("✅ latest");
fetch('https://api.github.com/repos/netanel-haber/checkers/commits?per_page=2').then(res => res.json()).then(([, { sha }]) => {
  const commitBeforeHead = sha.slice(0, 7);
  if (commitBeforeHead === headDuringBuild) {
    github.appendChild(LATEST)
  };
});