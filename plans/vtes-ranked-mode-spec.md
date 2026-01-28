# Feature Specification: RANKED MODE (Competitive)

## 1. Overview

El Modo Ranked es la experiencia competitiva core del juego. A diferencia del modo práctica, los jugadores se enfrentan a un mazo fijo de 20 cartas con una curva de dificultad progresiva ("Ramp-up"). El objetivo es maximizar el puntaje acumulado mediante la precisión y el mantenimiento de rachas (Streaks). No hay vidas; la partida siempre termina tras la carta #20.

## 2. Match Configuration & Deck Building

Cada partida Ranked consta de exactamente 20 cartas. El mazo se genera dinámicamente al inicio, seleccionando cartas basadas en su Tier de rareza/dificultad y ordenándolas de menor a mayor dificultad.

### Distribución del Mazo (Difficulty Curve)

| Orden de Aparición | Tier de Dificultad | Cantidad | Descripción | Puntos Base |
|--------------------|---------------------|----------|-------------|-------------|
| Cartas 1-6 | Nivel 1 | 6 | Staples, muy comunes, arte icónico. | 10 pts |
| Cartas 7-11 | Nivel 2 | 5 | Cartas comunes de torneos. | 20 pts |
| Cartas 12-15 | Nivel 3 | 4 | Cartas de arquetipos específicos. | 30 pts |
| Cartas 16-18 | Nivel 4 | 3 | Cartas nicho o antiguas. | 50 pts |
| Cartas 19-20 | Nivel 5 | 2 | "Boss Cards". Raras, malas o muy oscuras. | 80 pts |
| **TOTAL** | | **20** | | **660 pts (Max Base)** |

### Sorting Logic

El array de cartas `matchCards` debe estar ordenado estrictamente por Nivel (1 -> 5) para asegurar la experiencia de "Escalada".

## 3. Gameplay Rules

- **Opciones:** 4 Botones (1 Correcta + 3 Distractores Semánticos generados por IA)
- **Skip:** Deshabilitado. El jugador debe seleccionar una opción obligatoriamente.
- **Game Over:** No existe condición de derrota prematura. La partida finaliza únicamente al resolver la carta #20.

## 4. Scoring Economy & Streak System

### Lógica de Puntuación

El puntaje se calcula por carta individual y se suma al `TotalScore`.

```
Score = Roundup(BasePoints * StreakMultiplier)
```

### Multiplicador de Racha (Streak Multiplier)

El sistema premia la consistencia (consecutive hits). El multiplicador se recalcula antes de otorgar los puntos de la carta actual.

| Racha Actual (Aciertos seguidos) | Multiplicador | Feedback Visual (UI) |
|----------------------------------|---------------|----------------------|
| 0 - 4 | x 1.0 | (Hidden/Normal) |
| 5 - 9 | x 1.1 | Icono "Spark" / Bronce |
| 10 - 14 | x 1.2 | Icono "Flame" / Plata |
| 15 + | x 1.3 | Icono "Inferno" / Oro (Max) |

## 5. Implementation Checklist

- [ ] Crear función `generateRankedPlaylist` con nueva distribución (6/5/4/3/2)
- [ ] Implementar sorting estricto por dificultad (1 -> 5)
- [ ] Actualizar valores de puntos: 10/20/30/50/80
- [ ] Deshabilitar botón SKIP en modo Ranked
- [ ] Implementar sistema de streak multiplier (1.0 / 1.1 / 1.2 / 1.3)
- [ ] Añadir feedback visual para rachas (Spark/Flame/Inferno)
- [ ] Actualizar UI de score para mostrar multiplicador activo
- [ ] Documentar cambios en CLAUDE.md

## 6. Files to Modify

- `src/app/vtes/guess-card/page.tsx` - Main game component
- `CLAUDE.md` - Update documentation

## 7. Testing Scenarios

1. Verificar que la distribución sea exactamente 20 cartas
2. Verificar que las cartas estén ordenadas por dificultad
3. Verificar puntos base por nivel
4. Verificar streak multiplier en diferentes rangos
5. Verificar que SKIP esté deshabilitado en Ranked
6. Verificar feedback visual de rachas
