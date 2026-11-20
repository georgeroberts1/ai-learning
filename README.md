# Poteto Playbook Quest

A small game that explains each `/poteto-mode` playbook from [pstack](https://github.com/cursor/plugins/tree/main/pstack) for learners. Pick a level and watch the potato walk through the steps.

Turn on **CS mode** on the home screen for a harder version aimed at computer science students. Each playbook gets a CS lens (a real concept such as Amdahl's law or topological sort, with code), an order-the-steps puzzle, and a harder boss question.

```text
npm start    # serves docs/ at http://localhost:8000
npm test     # one test per playbook, checked against the real playbook files
```

The page is static files in `docs/`, so GitHub Pages can serve it directly (Settings, Pages, deploy from branch, `/docs`).

The tests read the installed pstack plugin from `~/.claude/plugins/cache/cursor-plugins/pstack`. Set `POTETO_PLAYBOOKS` to point at another copy of the `playbooks/` folder.
