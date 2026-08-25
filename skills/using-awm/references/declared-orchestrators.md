# Declared Orchestrators

An installed registry may declare an orchestrator with identity, applicability, work, and termination target; it never carries process vocabulary, credentials, or secrets.

- A declared orchestrator that applies is considered before `development-process` and `product-process`.
- Ordering among declared orchestrators comes from the termination contract, not a framework precedence, priority, or order field. Each names its successor.
- One orchestrator is active at a time; it reaches its terminal state before naming another declared orchestrator, `development-process`, `product-process`, or none.
- If two or more declared orchestrators apply and none names the other, apply none of them and continue with the built-in table.
- If a successor is not installed, say so and continue with the built-in table; never abort.
- Fail safe: if a declared orchestrator cannot run, including when its dependency is unavailable, say so and continue. Never block the user from working.
- If no declared orchestrator applies, route through the built-in table and do not mention declared orchestrators.
