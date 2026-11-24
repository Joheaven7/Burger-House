export function BurgerFallback({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
      aria-hidden="true"
    >
      {/* ground shadow */}
      <ellipse cx="200" cy="338" rx="130" ry="14" fill="#171717" opacity="0.15" />

      {/* bottom bun */}
      <path d="M70 262h260c0 28-22 46-52 46H122c-30 0-52-18-52-46z" fill="#cd7a28" />

      {/* seared patty */}
      <rect x="62" y="226" width="276" height="42" rx="21" fill="#381e12" />

      {/* melted cheese */}
      <path
        d="M70 212H330L318 236L292 222L262 240L232 222L200 242L168 222L138 240L108 222L82 236Z"
        fill="#f7a71b"
      />

      {/* crisp lettuce */}
      <path d="M64 198q17 -16 34 0t34 0t34 0t34 0t34 0t34 0t34 0t34 0t34 0v20H64z" fill="#4f9938" />

      {/* vine-ripened tomatoes */}
      <ellipse cx="140" cy="204" rx="46" ry="9" fill="#c93322" />
      <ellipse cx="262" cy="204" rx="46" ry="9" fill="#c93322" />

      {/* golden brioche top bun */}
      <path d="M62 190C62 112 120 68 200 68S338 112 338 190Z" fill="#d98734" />
      <path d="M96 150C108 108 148 86 196 84" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.3" />

      {/* toasted sesame seeds */}
      <g fill="#fae9c3">
        <ellipse cx="150" cy="122" rx="7" ry="4" transform="rotate(-20 150 122)" />
        <ellipse cx="200" cy="102" rx="7" ry="4" transform="rotate(10 200 102)" />
        <ellipse cx="252" cy="122" rx="7" ry="4" transform="rotate(25 252 122)" />
        <ellipse cx="118" cy="156" rx="7" ry="4" transform="rotate(-35 118 156)" />
        <ellipse cx="180" cy="144" rx="7" ry="4" transform="rotate(15 180 144)" />
        <ellipse cx="232" cy="150" rx="7" ry="4" transform="rotate(-10 232 150)" />
        <ellipse cx="286" cy="156" rx="7" ry="4" transform="rotate(35 286 156)" />
        <ellipse cx="206" cy="172" rx="7" ry="4" transform="rotate(5 206 172)" />
      </g>
    </svg>
  );
}
