export default function GlassBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      
      {/* BASE GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-primary/20 to-white" />

      {/* BLOBS / LIGHT EFFECT */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-red-800/70 rounded-full blur-3xl" />

      <div className="absolute bottom-[-120px] right-[-80px] w-[400px] h-[400px] bg-red-800/70 rounded-full blur-3xl" />

      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-rose-500/50 rounded-full blur-3xl" />

    </div>
  );
}