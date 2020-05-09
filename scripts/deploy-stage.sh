BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
git update-ref refs/heads/stage refs/heads/$BRANCH_NAME
git push -u origin stage -f