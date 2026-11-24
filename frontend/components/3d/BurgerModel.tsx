import { DoubleSide } from "three";

// Culinary colors for the 3D gourmet burger
const COLORS = {
  bunTop: "#d98734",
  bunBottom: "#cd7a28",
  patty: "#381e12",
  cheese: "#f7a71b",
  lettuce: "#4f9938",
  tomato: "#c93322",
  seed: "#fae9c3",
} as const;

const SEED_COUNT = 16;
const GOLDEN_ANGLE = 2.399963; // spreads seeds evenly without randomness

const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => {
  const angle = i * GOLDEN_ANGLE;
  const radius = 0.82 * Math.sqrt((i + 0.5) / SEED_COUNT);
  // height of the dome surface at this distance from the centre
  const y = 0.85 * Math.sqrt(1 - (radius / 1.05) ** 2) + 0.02;
  return {
    key: i,
    position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number],
    rotationY: -angle,
  };
});

export function BurgerModel() {
  return (
    <group position={[0, 0.13, 0]}>
      {/* Bottom toasted brioche bun (lower half of a squashed sphere) */}
      <mesh position={[0, -0.62, 0]} scale={[1.05, 0.5, 1.05]}>
        <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color={COLORS.bunBottom} roughness={0.7} side={DoubleSide} />
      </mesh>

      {/* Seared dry-aged beef patty */}
      <mesh position={[0, -0.45, 0]}>
        <cylinderGeometry args={[1.02, 1.02, 0.34, 32]} />
        <meshStandardMaterial color={COLORS.patty} roughness={0.92} />
      </mesh>

      {/* Melted aged cheddar (square, turned so corners drape over edges) */}
      <mesh position={[0, -0.25, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[1.7, 0.06, 1.7]} />
        <meshStandardMaterial color={COLORS.cheese} roughness={0.45} metalness={0.05} />
      </mesh>

      {/* Crisp butterhead lettuce (flattened ring) */}
      <mesh position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]}>
        <torusGeometry args={[0.95, 0.1, 8, 32]} />
        <meshStandardMaterial color={COLORS.lettuce} roughness={0.55} />
      </mesh>

      {/* Vine-ripened tomato slices */}
      <mesh position={[0.35, -0.1, 0.3]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 24]} />
        <meshStandardMaterial color={COLORS.tomato} roughness={0.35} />
      </mesh>
      <mesh position={[-0.4, -0.1, -0.2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.08, 24]} />
        <meshStandardMaterial color={COLORS.tomato} roughness={0.35} />
      </mesh>

      {/* Golden brioche top bun with toasted sesame seeds */}
      <group position={[0, -0.04, 0]}>
        <mesh scale={[1.05, 0.85, 1.05]}>
          <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={COLORS.bunTop} roughness={0.65} side={DoubleSide} />
        </mesh>
        {SEEDS.map((seed) => (
          <mesh
            key={seed.key}
            position={seed.position}
            rotation={[0, seed.rotationY, 0]}
            scale={[1.6, 0.7, 0.9]}
          >
            <sphereGeometry args={[0.05, 8, 6]} />
            <meshStandardMaterial color={COLORS.seed} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
