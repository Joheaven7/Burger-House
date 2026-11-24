export function BurgerLighting() {
  return (
    <>
      {/* Warm ambient culinary lighting */}
      <hemisphereLight args={["#fff8ee", "#5c381e", 1.2]} />

      {/* Main key light */}
      <directionalLight position={[3.5, 5, 4.5]} intensity={2.4} color="#ffffff" />

      {/* Warm copper rim & fill light */}
      <directionalLight position={[-4, 2.5, -3]} intensity={1.2} color="#e5b87a" />

      {/* Subtle under-bounce light */}
      <directionalLight position={[0, -3, 2]} intensity={0.5} color="#c49a62" />
    </>
  );
}
