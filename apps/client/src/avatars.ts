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

  // Monstros da Masmorra
  SLIME: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="slimeBio" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#6ee7b7"/>
          <stop offset="50%" stop-color="#10b981"/>
          <stop offset="100%" stop-color="#064e3b"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#062e22" stroke="#059669" stroke-width="2"/>
      <!-- Corpo da Gosma Gelatinosa -->
      <path d="M28 85 C22 55, 38 35, 60 32 C82 35, 98 55, 92 85 C88 100, 32 100, 28 85 Z" fill="url(#slimeBio)"/>
      <!-- Brilho Gelatinoso -->
      <ellipse cx="48" cy="46" rx="8" ry="4" fill="#d1fae5" opacity="0.6" transform="rotate(-15 48 46)"/>
      <!-- Núcleo de Mana da Besta -->
      <circle cx="60" cy="65" r="9" fill="#f43f5e" filter="drop-shadow(0 0 6px #e11d48)"/>
      <!-- Olhos e Expressão Monstruosa -->
      <circle cx="45" cy="58" r="4" fill="#064e3b"/>
      <circle cx="46" cy="57" r="1.5" fill="#f8fafc"/>
      <circle cx="75" cy="58" r="4" fill="#064e3b"/>
      <circle cx="76" cy="57" r="1.5" fill="#f8fafc"/>
    </svg>
  `,

  GOBLIN: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goblinSkin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#84cc16"/>
          <stop offset="60%" stop-color="#4d7c0f"/>
          <stop offset="100%" stop-color="#1a2e05"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#142006" stroke="#4d7c0f" stroke-width="2"/>
      <!-- Orelhas Grandes Pontudas -->
      <path d="M38 52 L12 40 L34 68 Z" fill="#65a30d" stroke="#365314" stroke-width="2"/>
      <path d="M82 52 L108 40 L86 68 Z" fill="#65a30d" stroke="#365314" stroke-width="2"/>
      <!-- Cabeça e Nariz Feio -->
      <ellipse cx="60" cy="64" rx="26" ry="24" fill="url(#goblinSkin)"/>
      <polygon points="56,66 64,66 60,78" fill="#365314"/>
      <!-- Olhos Amarelos Cruéis -->
      <ellipse cx="48" cy="56" rx="5" ry="4" fill="#fef08a"/>
      <circle cx="48" cy="56" r="2" fill="#854d0e"/>
      <ellipse cx="72" cy="56" rx="5" ry="4" fill="#fef08a"/>
      <circle cx="72" cy="56" r="2" fill="#854d0e"/>
      <!-- Presas Inferiores -->
      <path d="M48 84 Q60 88 72 84 L70 80 Q60 84 50 80 Z" fill="#0f172a"/>
      <polygon points="51,82 54,76 57,82" fill="#fef9c3"/>
      <polygon points="63,82 66,76 69,82" fill="#fef9c3"/>
    </svg>
  `,

  WOLF: `
    <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wolfSmoke" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#090a16" stroke="#4338ca" stroke-width="2"/>
      <circle cx="60" cy="60" r="48" fill="url(#wolfSmoke)"/>
      <!-- Cabeça do Lobo de Sombras -->
      <path d="M60 28 L74 48 L88 38 L80 62 L94 72 L78 84 L60 102 L42 84 L26 72 L40 62 L32 38 L46 48 Z" fill="#1e1b4b" stroke="#312e81" stroke-width="2"/>
      <!-- Focinho e Presas -->
      <polygon points="54,82 66,82 60,94" fill="#020617"/>
      <!-- Olhos Azuis Espectrais de Fera -->
      <polygon points="46,58 54,62 48,66" fill="#38bdf8" filter="drop-shadow(0 0 4px #0ea5e9)"/>
      <polygon points="74,58 66,62 72,66" fill="#38bdf8" filter="drop-shadow(0 0 4px #0ea5e9)"/>
    </svg>
  `
};
