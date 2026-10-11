/**
 * Módulo de Avatares e Ilustrações Vetoriais (SVG) para Hunter RPG
 * Estética Dark Fantasy 90s/2000s (Diablo II + Solo Leveling + Naruto Game)
 */

export const AVATARS = {
  BATTLE_HEALER: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="healerAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#0b1020" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="goldPlate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#ca8a04"/>
          <stop offset="100%" stop-color="#854d0e"/>
        </linearGradient>
      </defs>
      <!-- Aura Divina -->
      <circle cx="60" cy="60" r="56" fill="url(#healerAura)"/>
      <circle cx="60" cy="22" r="16" fill="none" stroke="#fde047" stroke-width="3" stroke-dasharray="4,2"/>
      <!-- Capuz e Manto Sagrado -->
      <path d="M35 110 C35 75, 40 45, 60 40 C80 45, 85 75, 85 110 Z" fill="#0f172a" stroke="#ca8a04" stroke-width="2"/>
      <path d="M42 52 C50 42, 70 42, 78 52 C75 75, 68 85, 60 88 C52 85, 45 75, 42 52 Z" fill="#1e293b"/>
      <!-- Ombros de Armadura Dourada -->
      <path d="M25 110 Q40 85 52 95 Q35 105 25 110 Z" fill="url(#goldPlate)"/>
      <path d="M95 110 Q80 85 68 95 Q85 105 95 110 Z" fill="url(#goldPlate)"/>
      <!-- Cruz Sagrada de Luz -->
      <rect x="57" y="55" width="6" height="24" fill="#38bdf8" rx="2"/>
      <rect x="48" y="61" width="24" height="6" fill="#38bdf8" rx="2"/>
      <!-- Olhos de Mana Divina -->
      <ellipse cx="53" cy="54" rx="3" ry="1.5" fill="#bae6fd"/>
      <ellipse cx="67" cy="54" rx="3" ry="1.5" fill="#bae6fd"/>
    </svg>
  `,

  ASSASSIN: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="shadowGaze" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#818cf8" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <!-- Fumaça de Sombras -->
      <circle cx="60" cy="60" r="56" fill="url(#shadowGaze)"/>
      <path d="M15 115 C20 80, 40 40, 60 35 C80 40, 100 80, 105 115 Z" fill="#030712"/>
      <!-- Máscara e Capuz Ninja/Sombra -->
      <path d="M40 48 Q60 30 80 48 Q82 80 60 92 Q38 80 40 48 Z" fill="#0f172a" stroke="#4338ca" stroke-width="2"/>
      <!-- Adagas Cruzadas de Sombras -->
      <line x1="20" y1="105" x2="50" y2="70" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
      <line x1="100" y1="105" x2="70" y2="70" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
      <!-- Olhos Brilhantes de Solo Leveling -->
      <path d="M46 56 Q54 53 58 57 Q53 60 46 56 Z" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)"/>
      <path d="M74 56 Q66 53 62 57 Q67 60 74 56 Z" fill="#38bdf8" filter="drop-shadow(0 0 4px #38bdf8)"/>
    </svg>
  `,

  WARRIOR: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ironBevel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="50%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <!-- Fundo de Aço e Impacto -->
      <circle cx="60" cy="60" r="54" fill="#0f172a" stroke="#475569" stroke-width="3"/>
      <!-- Elmo de Placas Blindadas -->
      <path d="M35 110 L40 50 Q60 30 80 50 L85 110 Z" fill="url(#ironBevel)" stroke="#94a3b8" stroke-width="2"/>
      <!-- Crista do Elmo de Guerra -->
      <path d="M56 25 Q60 15 64 25 L64 55 L56 55 Z" fill="#b91c1c"/>
      <!-- Viseira com fenda ameaçadora -->
      <path d="M44 60 L76 60 L74 68 L60 72 L46 68 Z" fill="#020617"/>
      <line x1="47" y1="64" x2="73" y2="64" stroke="#f87171" stroke-width="2.5" filter="drop-shadow(0 0 3px #ef4444)"/>
      <!-- Rebites e Protetores de Queixo -->
      <circle cx="48" cy="80" r="2" fill="#94a3b8"/>
      <circle cx="72" cy="80" r="2" fill="#94a3b8"/>
      <circle cx="60" cy="86" r="2" fill="#94a3b8"/>
    </svg>
  `,

  MAGE: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="voidCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="70%" stop-color="#7e22ce"/>
          <stop offset="100%" stop-color="#0b1020"/>
        </radialGradient>
      </defs>
      <!-- Runas do Vazio Cósmico -->
      <circle cx="60" cy="60" r="54" fill="#090d16" stroke="#a855f7" stroke-width="2" stroke-dasharray="6,3"/>
      <!-- Manto com Estrelas Arcanas -->
      <path d="M30 115 C35 70, 45 42, 60 38 C75 42, 85 70, 90 115 Z" fill="#1e1b4b" stroke="#6b21a8" stroke-width="2"/>
      <path d="M44 48 Q60 34 76 48 Q78 78 60 88 Q42 78 44 48 Z" fill="#090d16"/>
      <!-- Orbe Dimensional Flutuante -->
      <circle cx="60" cy="62" r="14" fill="url(#voidCore)" filter="drop-shadow(0 0 8px #c084fc)"/>
      <ellipse cx="60" cy="62" rx="20" ry="6" fill="none" stroke="#e9d5ff" stroke-width="1.5" transform="rotate(-20 60 62)"/>
    </svg>
  `,

  // Monstros da Masmorra (Estética Dark Fantasy Gritty / Solo Leveling)
  SLIME: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="slimeCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/>
          <stop offset="60%" stop-color="#991b1b" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="slimeSkin" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stop-color="#14532d"/>
          <stop offset="45%" stop-color="#064e3b"/>
          <stop offset="85%" stop-color="#022c22"/>
          <stop offset="100%" stop-color="#05140d"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="#070d0a" rx="4"/>
      <!-- Poça ácida base -->
      <ellipse cx="60" cy="100" rx="46" ry="12" fill="#021c13"/>
      <!-- Forma abissal disforme com pontas e gotas -->
      <path d="M22 96 C16 70, 26 44, 46 36 C54 32, 66 32, 74 36 C94 44, 104 70, 98 96 C84 104, 36 104, 22 96 Z" fill="url(#slimeSkin)" stroke="#166534" stroke-width="2"/>
      <!-- Gotas viscosas e deformações -->
      <path d="M30 70 Q24 82 20 86 Q26 88 32 80 Z" fill="#14532d"/>
      <path d="M90 70 Q96 82 100 86 Q94 88 88 80 Z" fill="#14532d"/>
      <path d="M50 34 Q60 22 66 32 Z" fill="#15803d"/>
      <!-- Núcleo de mana instável pulsante -->
      <circle cx="60" cy="68" r="18" fill="url(#slimeCoreGlow)"/>
      <polygon points="60,54 68,66 60,78 52,66" fill="#f87171" stroke="#fca5a5" stroke-width="1.5"/>
      <circle cx="60" cy="66" r="4" fill="#ffffff"/>
      <!-- Fendas espectrais / olhos predatórios -->
      <path d="M42 56 Q50 54 54 58 Q48 60 42 56 Z" fill="#bbf7d0" opacity="0.85"/>
      <path d="M78 56 Q70 54 66 58 Q72 60 78 56 Z" fill="#bbf7d0" opacity="0.85"/>
    </svg>
  `,

  GOBLIN: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goblinLeather" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3f2e1e"/>
          <stop offset="100%" stop-color="#1c120c"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="#0d0e09" rx="4"/>
      <!-- Orelhas pontudas e rasgadas de combate -->
      <path d="M36 48 L8 32 L28 66 Z" fill="#365314" stroke="#1a2e05" stroke-width="2"/>
      <path d="M84 48 L112 32 L92 66 Z" fill="#365314" stroke="#1a2e05" stroke-width="2"/>
      <polygon points="14,35 18,40 12,42" fill="#0d0e09"/>
      <!-- Cabeça angulosa e ameaçadora -->
      <path d="M34 50 Q60 38 86 50 L84 82 Q60 96 36 82 Z" fill="#4d7c0f" stroke="#1e3a09" stroke-width="2"/>
      <!-- Queixo pronunciado e cicatriz -->
      <line x1="42" y1="52" x2="52" y2="76" stroke="#1e3a09" stroke-width="2"/>
      <!-- Olhos amarelos cruéis de predador -->
      <polygon points="44,56 54,58 46,64" fill="#facc15"/>
      <line x1="46" y1="58" x2="50" y2="60" stroke="#713f12" stroke-width="2"/>
      <polygon points="76,56 66,58 74,64" fill="#facc15"/>
      <line x1="74" y1="58" x2="70" y2="60" stroke="#713f12" stroke-width="2"/>
      <!-- Boca e presas pontiagudas irregulares -->
      <path d="M46 76 Q60 82 74 76" stroke="#141f07" stroke-width="3" fill="none"/>
      <polygon points="50,75 53,69 56,76" fill="#fef08a"/>
      <polygon points="64,75 67,69 70,76" fill="#fef08a"/>
      <!-- Peitoral de couro reforçado e cravos -->
      <path d="M26 112 L38 86 L82 86 L94 112 Z" fill="url(#goblinLeather)" stroke="#451a03" stroke-width="2"/>
      <circle cx="50" cy="98" r="3" fill="#78350f"/>
      <circle cx="70" cy="98" r="3" fill="#78350f"/>
    </svg>
  `,

  WOLF: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="shadowMane" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#312e81"/>
          <stop offset="60%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#030712"/>
        </radialGradient>
      </defs>
      <rect width="120" height="120" fill="#060713" rx="4"/>
      <!-- Espinhos e fumaça de sombras ao redor da fera -->
      <path d="M60 14 L68 34 L88 20 L80 44 L102 38 L88 62 L106 72 L86 86 L98 108 L60 98 L22 108 L34 86 L14 72 L32 62 L18 38 L40 44 L32 20 L52 34 Z" fill="url(#shadowMane)" stroke="#4338ca" stroke-width="1.5"/>
      <!-- Cabeça e crânio angular -->
      <polygon points="60,32 78,60 60,94 42,60" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Focinho negro e presas -->
      <polygon points="56,80 64,80 60,92" fill="#020617"/>
      <polygon points="50,78 54,72 56,79" fill="#f8fafc"/>
      <polygon points="70,78 66,72 64,79" fill="#f8fafc"/>
      <!-- Olhos espectrais gélidos de Solo Leveling -->
      <polygon points="44,54 54,58 46,62" fill="#38bdf8"/>
      <circle cx="48" cy="58" r="1.5" fill="#ffffff"/>
      <polygon points="76,54 66,58 74,62" fill="#38bdf8"/>
      <circle cx="72" cy="58" r="1.5" fill="#ffffff"/>
      <!-- Rastro de fogo sombrio saindo dos olhos -->
      <path d="M44 54 Q36 46 40 40" stroke="#0ea5e9" stroke-width="2" fill="none"/>
      <path d="M76 54 Q84 46 80 40" stroke="#0ea5e9" stroke-width="2" fill="none"/>
    </svg>
  `
};
