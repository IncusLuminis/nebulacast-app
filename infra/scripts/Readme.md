# Основное репо (как раньше)
python infra/scripts/dev_api_server.py 8081

# Worktree
cd /Users/mloktionov/PycharmProjects/Personal/nebulacast-app/.claude/worktrees/zealous-beaver

# Запустить сервер (staging берётся из того же worktree)
python infra/scripts/dev_api_server.py 8081 sites/staging
