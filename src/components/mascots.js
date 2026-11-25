/**
 * Custom Vector SVG Mascots for FATAMA Fighting Dragons:
 * 1. Master Bruce (Dojang Head Instructor, 5th Dan Black Belt)
 * 2. Kiko (Dragon Cadet / QMODSIM Analyst)
 * Supports 3 visual style variants: 'dojang' | 'cyber' | 'tournament'
 * Plus animated emotion states: 'happy' | 'curious' | 'explaining' | 'surprised' | 'sparkle'
 */

export function renderMascotSvg(character = 'mentor', variant = 'dojang', emotion = 'happy', isSpeaking = false, size = 104) {
  const palettes = {
    dojang: {
      gi: '#f8fafc',
      giShade: '#e2e8f0',
      collar: character === 'mentor' ? '#0f172a' : '#e11d48',
      belt: character === 'mentor' ? '#0f172a' : '#facc15',
      trim: '#e11d48',
      accent: '#f59e0b',
    },
    cyber: {
      gi: '#0f172a',
      giShade: '#1e293b',
      collar: '#22d3ee',
      belt: character === 'mentor' ? '#f43f5e' : '#22d3ee',
      trim: '#22d3ee',
      accent: '#38bdf8',
    },
    tournament: {
      gi: '#fff1f2',
      giShade: '#ffe4e6',
      collar: character === 'mentor' ? '#be123c' : '#1d4ed8',
      belt: character === 'mentor' ? '#0f172a' : '#ef4444',
      trim: '#f59e0b',
      accent: '#e11d48',
    },
  };

  const p = palettes[variant] || palettes.dojang;
  const mouth =
    emotion === 'surprised'
      ? '<ellipse cx="100" cy="108" rx="5.5" ry="6.5" fill="#0f172a" />'
      : emotion === 'explaining'
        ? `<path d="M93 106 Q100 ${isSpeaking ? '114' : '111'} 107 106" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>`
        : '<path d="M92 104 Q100 112 108 104" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>';

  const eyeR = emotion === 'surprised' ? 6.2 : 5.2;
  const brow =
    emotion === 'curious'
      ? '<path d="M77 77 Q84 72 90 77" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/><path d="M110 79 Q116 76 123 79" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/>'
      : emotion === 'surprised'
        ? '<path d="M77 74 Q84 70 90 74" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/><path d="M110 74 Q116 70 123 74" fill="none" stroke="#0f172a" stroke-width="2.6" stroke-linecap="round"/>'
        : '<path d="M78 78 Q84 75 90 78" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/><path d="M110 78 Q116 75 122 78" fill="none" stroke="#0f172a" stroke-width="2.4" stroke-linecap="round"/>';

  const sparkleBadge =
    emotion === 'sparkle'
      ? `<polygon points="154,38 157,46 165,49 157,52 154,60 151,52 143,49 151,46" fill="${p.accent}" />`
      : '';

  const headpiece =
    character === 'mentor'
      ? `
        <!-- Headband / Martial Hair -->
        <path d="M62 72 Q65 40 100 38 Q135 40 138 72 Q122 58 100 60 Q78 58 62 72 Z" fill="#1e293b"/>
        <rect x="61" y="61" width="78" height="10" rx="4" fill="${p.trim}" />
        <path d="M137 64 L152 58 L148 70 Z" fill="${p.trim}" />
      `
      : `
        <!-- Dragon Cadet Horns & Crest -->
        <path d="M72 52 L62 30 L84 44 Z" fill="${p.accent}" />
        <path d="M128 52 L138 30 L116 44 Z" fill="${p.accent}" />
        <path d="M64 70 Q68 42 100 40 Q132 42 136 70 Q118 58 100 60 Q82 58 64 70 Z" fill="${p.trim}"/>
      `;

  const prop =
    character === 'mentor'
      ? `
        <!-- Tactical Clipboard / Tablet -->
        <g transform="translate(132, 128)">
          <rect x="0" y="0" width="32" height="40" rx="5" fill="#1e293b" stroke="${p.trim}" stroke-width="2"/>
          <rect x="5" y="7" width="22" height="24" rx="2" fill="#020617"/>
          <path d="M7 22 L12 18 L17 20 L24 11" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round"/>
        </g>
      `
      : `
        <!-- QR & Formula Pad -->
        <g transform="translate(34, 130)">
          <rect x="0" y="0" width="30" height="36" rx="5" fill="#0f172a" stroke="${p.accent}" stroke-width="2"/>
          <rect x="6" y="7" width="8" height="8" fill="#22d3ee" rx="1"/>
          <rect x="16" y="7" width="8" height="8" fill="#f43f5e" rx="1"/>
          <line x1="6" y1="22" x2="24" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
          <line x1="6" y1="28" x2="19" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;

  const speakRing = isSpeaking
    ? `<circle cx="100" cy="100" r="92" fill="none" stroke="${p.trim}" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.65" />`
    : '';

  return `
    <svg viewBox="0 0 200 200" width="${size}" height="${size}" class="mascot-svg ${isSpeaking ? 'is-speaking' : ''}" aria-hidden="true">
      ${speakRing}
      <!-- Dobok / Gi Torso -->
      <path d="M52 184 C54 142 72 130 100 130 C128 130 146 142 148 184 Z" fill="${p.gi}" stroke="#334155" stroke-width="2.5"/>
      <!-- V-Neck Dobok Collar -->
      <path d="M82 131 L100 156 L118 131" fill="none" stroke="${p.collar}" stroke-width="7" stroke-linejoin="round"/>
      <!-- Belt -->
      <rect x="56" y="160" width="88" height="11" rx="4" fill="${p.belt}" />
      <path d="M96 164 L88 184 M104 164 L112 184" stroke="${p.belt}" stroke-width="6" stroke-linecap="round"/>
      ${character === 'mentor' ? '<rect x="104" y="161" width="4" height="9" fill="#f59e0b"/>' : ''}
      <!-- Head -->
      <circle cx="100" cy="88" r="38" fill="#fde6d2" stroke="#334155" stroke-width="2.5"/>
      <!-- Cheeks -->
      <ellipse cx="74" cy="98" rx="5.5" ry="3.2" fill="#fda4af" opacity="0.7"/>
      <ellipse cx="126" cy="98" rx="5.5" ry="3.2" fill="#fda4af" opacity="0.7"/>
      ${headpiece}
      ${brow}
      <!-- Eyes -->
      <circle cx="84" cy="89" r="${eyeR}" fill="#0f172a"/>
      <circle cx="116" cy="89" r="${eyeR}" fill="#0f172a"/>
      <circle cx="85.8" cy="87.2" r="1.8" fill="#ffffff"/>
      <circle cx="117.8" cy="87.2" r="1.8" fill="#ffffff"/>
      ${mouth}
      ${prop}
      ${sparkleBadge}
    </svg>
  `;
}

