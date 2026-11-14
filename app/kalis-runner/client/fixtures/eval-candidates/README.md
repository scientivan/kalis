Test candidates for the runner `evaluate` command (private test of a bounty candidate).
- `lazy.wasm`: app/guest-spike built with `--features lazy` (skips its declared self_check step).
- `wrong-cost.wasm`: app/guest-spike with `--features pruning`, patched to report cost + 0.5.
Both are deliberately broken. Do not publish them.
