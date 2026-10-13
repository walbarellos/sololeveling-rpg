# Princípio da Herança

## Conceito
Mecanismo para criar novas classes a partir de classes existentes, promovendo reutilização de código e relações "é-um".

## No Projeto
- **Limitada e intencional**: Apenas `WorldScene extends Phaser.Scene` (`world.scene.ts:57`) — driven por framework
- **`SystemClock implements Clock`** (`clock.ts:7`): implementa interface de tempo
- **`InMemoryPlayerRepository implements PlayerRepository`** (`player.repository.ts:77`): implementa interface de repositório

## Preferência por Composição
- **`BattleEngineDependencies`** (`battle-engine.service.ts:21-32`): interface de composição de múltiplos serviços, não hierarquia `extends` profunda
- **`CLASS_STATS`** (`skills.data.ts:29-210`): registro de configs, não herança de classe
- **HunterClass** usado como discriminant/string em vez de class hierarchy

## Decisão de Design
- Herança usada apenas quando necessário (adaptação a frameworks)
- Composição preferida para lógica de domínio
- Interfaces usadas para contratos

## Referências
- `clock.ts:7`, `player.repository.ts:77`
- `battle-engine.service.ts:21-32`
- `skills.data.ts:29-210`
