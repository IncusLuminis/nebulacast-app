# Основное репо (как раньше)
python infra/scripts/dev_api_server.py 8081

# Worktree
cd /Users/mloktionov/PycharmProjects/Personal/nebulacast-app/.claude/worktrees/magical-mendeleev

# Запустить сервер (staging берётся из того же worktree)
python infra/scripts/dev_api_server.py 8083 sites/staging
