# Commits na `main` com revisão local; branches e PRs em colaboração

Neste entregável os commits entram diretamente na `main` porque as mudanças são revisadas localmente (via GitHub Desktop) antes do `push`. Com um único fluxo de trabalho e revisão pré-push no ambiente do autor, o overhead de branch por fatia e pull request não acrescenta valor proporcional à avaliação.

Em cenário com múltiplas pessoas na mesma peça de trabalho, o fluxo adequado é branches segmentadas e pull requests: a revisão ocorre antes da integração na `main`, reduzindo risco de conflito, regressão e commits opacos para quem não acompanhou o histórico local.

**Considered options:** commits diretos na `main` com revisão local pré-push; branches efêmeras + PRs para toda alteração; proteção de `main` com CI obrigatório.
