$ErrorActionPreference = 'Stop'
$commits = (git log --reverse --format="%H")
git checkout --orphan temp_rebuild
git rm -rf .
$i = 1
foreach ($c in $commits) {
    Write-Host "Replaying commit $i..."
    git cherry-pick --allow-empty -m 1 $c 2>$null
    git commit --amend -m "commit $i" --allow-empty 2>$null
    $i++
}
git branch -M main
git push -f origin main
Write-Host "Done!"
