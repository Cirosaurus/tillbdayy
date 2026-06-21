'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Hapus Sparkles & Heart dari lucide-react karena udah diganti jadi PNG
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
// Mesin 3D
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';
// Loader VRM
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';
// Library Confetti
import confetti from 'canvas-confetti';

// ==========================================
// 0. KOMPONEN LOADING BAR (OVERLAY)
// ==========================================
function ProgressOverlay({ onLoaded }: { onLoaded: () => void }) {
  const { progress } = useProgress();

  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [progress, onLoaded]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#fff0f3] rounded-[36px] overflow-hidden"
    >
      <img src="/loading.gif" alt="Loading..." className="w-20 h-20 mb-6 object-contain" />

      <h2 className="text-[#4a3b32] font-black text-xl mb-2 text-center uppercase tracking-wider px-4">
        Preparing Something...
      </h2>
      <p className="text-sm font-bold text-[#4a3b32] mb-6 tracking-wide">
        Please wait until it's done! ({progress.toFixed(0)}%)
      </p>

      <div className="w-48 h-4 bg-white rounded-full overflow-hidden border-2 border-[#4a3b32] shadow-[2px_2px_0px_0px_#4a3b32]">
        <motion.div
          className="h-full bg-[#ff758f]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
}

// ==========================================
// 1. KOMPONEN KUE 3D
// ==========================================
function Cake3D() {
  const { scene } = useGLTF('/cake.glb');
  return <primitive object={scene} scale={0.05} position={[0, -4, 0]} />;
}

// ==========================================
// 2. KOMPONEN KADO 3D
// ==========================================
function Gift3D({ onClick }: { onClick: () => void }) {
  const { scene } = useGLTF('/gift.glb');
  return (
    <primitive
      object={scene}
      scale={1.5}
      position={[0, -1, 0]}
      onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    />
  );
}

// ==========================================
// 3. KOMPONEN KARAKTER VRM
// ==========================================
function CharaVRM({ isTransitioning, isPopped, onClick }: { isTransitioning: boolean, isPopped: boolean, onClick: (e: any) => void }) {
  const gltf = useLoader(GLTFLoader, '/chara.vrm', (loader) => {
    loader.register((parser) => new VRMLoaderPlugin(parser));
  });

  const velocityY = useRef(0);
  const velocityZ = useRef(0);
  const hasLaunched = useRef(false);

  useFrame((state, delta) => {
    const vrm = gltf.userData.vrm;
    if (!vrm) return;

    vrm.update(delta);

    // Animasi Mental pas diklik
    if (isTransitioning) {
      if (!hasLaunched.current) {
        velocityY.current = 20;
        velocityZ.current = -15;
        hasLaunched.current = true;
      }

      gltf.scene.position.y += velocityY.current * delta;
      gltf.scene.position.z += velocityZ.current * delta;
      velocityY.current -= 35 * delta;

      gltf.scene.rotation.x += 6 * delta;
      gltf.scene.rotation.y += 3 * delta;
      return;
    }

    // Animasi Idle (Napas & Ngambang) tetep ada
    const time = state.clock.elapsedTime;
    const s = Math.sin(Math.PI * time);

    // Opsional: gerakan tubuh halus kalau dibutuhin
  });

  // VRM hilang total setelah masuk mode sad (isPopped)
  if (isPopped) return null;

  return (
    <primitive
      object={gltf.scene}
      position={[0, 2.2, 4]}
      rotation={[-1.5, Math.PI, 0]}
      scale={5}
      onClick={onClick}
      onPointerOver={() => { if (!isTransitioning) document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    />
  );
}

// ==========================================
// 4. KONTROL INTERPOLASI KAMERA
// ==========================================
function CameraController({ isTransitioning }: { isTransitioning: boolean }) {
  const { camera } = useThree();

  useFrame((state) => {
    // Kamera cuma dipaksa gerak ke atas pas masa transisi (karakter lagi mental)
    if (isTransitioning) {
      const targetPos = new THREE.Vector3(0, 24, 2);
      camera.position.lerp(targetPos, 0.04);

      const targetLook = new THREE.Vector3(0, 0, 0);
      if (state.controls && 'target' in state.controls) {
  (state.controls as any).target.lerp(targetLook, 0.04);
}
    }
  });

  return null;
}


// ==========================================
// 5. KOMPONEN DEKORASI GANTUNGAN (BUNTING)
// ==========================================
function BuntingBanner({ isPopped }: { isPopped: boolean }) {
  if (isPopped) return null;

  const flags = [
    'border-t-[#DCE4E1]', 'border-t-[#F3DCA7]', 'border-t-[#8F3D24]', 'border-t-[#2A3A65]',
    'border-t-[#A6C5B9]', 'border-t-[#F37AA1]', 'border-t-[#433A41]',
    'border-t-[#DCE4E1]'
  ];

  return (
    <div className="absolute top-0 w-full flex justify-center gap-4 sm:gap-8 px-4 pointer-events-none z-0 overflow-hidden">
      {/* Garis lengkung tipis ala tali */}
      <div className="absolute top-0 w-[150%] h-12 border-b-2 border-[#4a3b32]/20 rounded-[100%] -translate-y-6" />

      {/* Bendera Segitiga */}
      {flags.map((color, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, rotate: -20 }}
          animate={{ y: 0, rotate: i % 2 === 0 ? 5 : -5 }}
          transition={{ duration: 1.2, delay: i * 0.1, type: "spring", bounce: 0.5 }}
          className={`w-0 h-0 border-l-[25px] sm:border-l-[35px] border-l-transparent border-r-[25px] sm:border-r-[35px] border-r-transparent border-t-[45px] sm:border-t-[65px] ${color} mt-2 origin-top drop-shadow-sm`}
        />
      ))}
    </div>
  );
}

// ==========================================
// 6. KOMPONEN PNG JATUH (BISA DISENTUH/DRAG)
// ==========================================
function FallingToys({ constraintsRef }: { constraintsRef: React.RefObject<HTMLElement> }) {
  const toys = ['/toy1.png', '/toy2.png', '/toy3.png'];

  // Posisi akhir mainan pas mencar (Kiri, Tengah-Bawah, Kanan)
  const scatterX = [-140, 0, 140];
  const scatterY = [150, 220, 150];

  // 1. State penentu kapan mainan boleh masuk ke DOM
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // 2. Kasih waktu 500ms buat browser "napas" ngerender 3D Cake
    const timer = setTimeout(() => setShouldRender(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 3. KUNCINYA DI SINI: Kalau belum 500ms, jangan render apa-apa (kembalikan null)
  // Ini bikin Framer Motion baru mulai ngitung animasi pas browser udah beneran stabil
  if (!shouldRender) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden flex items-center justify-center">
      {toys.map((src, i) => (
        <motion.img
          key={i}
          src={src}
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.2}
          whileDrag={{ scale: 1.2, cursor: "grabbing" }}
          // Karena mount-nya di-delay, Framer bakal ngebaca initial dan animate ini fresh kayak pas lo nge-save code
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{ x: scatterX[i], y: scatterY[i], scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5, duration: 2, delay: i * 0.1 }}
          className="absolute w-34 h-34 object-contain cursor-grab pointer-events-auto drop-shadow-xl"
        />
      ))}
    </div>
  );
}

// ==========================================
// HALAMAN UTAMA
// ==========================================
export default function BirthdayPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [is3DLoaded, setIs3DLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPopped, setIsPopped] = useState(false);

  // Tambahin 2 baris ini:
  const containerRef = useRef<HTMLElement>(null); // Buat nahan PNG biar mentok layar
  const giftSfxRef = useRef<HTMLAudioElement | null>(null); // SFX pas kado ditekan

  // Ini bawaan lu sebelumnya:
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const forceResize = () => window.dispatchEvent(new Event('resize'));
    const t1 = setTimeout(forceResize, 50);
    const t2 = setTimeout(forceResize, 500);
    const t3 = setTimeout(forceResize, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, isPopped, is3DLoaded]);

  const handleOpen = () => {
    // Tambahin blok ini buat SFX kado
    if (giftSfxRef.current) {
      giftSfxRef.current.currentTime = 0;
      giftSfxRef.current.play();
    }

    setIsOpen(true);
    document.body.style.cursor = 'auto';
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleCharaClick = (e: any) => {
    e.stopPropagation();
    if (isPopped || isTransitioning) return;

    setIsTransitioning(true);
    document.body.style.cursor = 'auto';

    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (sfxRef.current) {
      sfxRef.current.currentTime = 0;
      sfxRef.current.play();
    }

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#ff758f', '#fbe068', '#ffffff', '#84cc16', '#3b82f6']
    });

    // Langsung transisi ke MV setelah 2.2 detik
    setTimeout(() => {
      setIsPopped(true);
      // FIX: Lepas kunci transisi biar kameranya bebas muter lagi dikendalikan OrbitControls
      setIsTransitioning(false);

      if (videoRef.current) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(e => console.error("Auto-play prevented", e));
      }
    }, 2200);
  };

  return (
    <main ref={containerRef} className="min-h-screen bg-[#BCE4E1] flex flex-col justify-center items-center p-6 font-sans overflow-hidden relative selection:bg-[#ff758f] selection:text-white">

      <BuntingBanner isPopped={isPopped} />
      {/* Tambahin is3DLoaded biar dia nunggu loading screen beres dan kue muncul dulu */}
      {isOpen && is3DLoaded && !isPopped && <FallingToys constraintsRef={containerRef} />}

      {/* MV BACKGROUND */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isPopped ? 1 : 0 }}
        transition={{ duration: 2.5 }}
        className={`absolute inset-0 w-full h-full bg-black ${isPopped ? 'z-0' : '-z-10'}`}
        style={{ pointerEvents: isPopped ? 'auto' : 'none' }}
      >
        <video
          ref={videoRef}
          src="/mv.mp4"
          playsInline
          loop
          preload="auto"
          className="w-full h-full object-cover opacity-60"
        />
      </motion.div>

      <audio ref={audioRef} src="/hbd.mp3" loop preload="auto" />
      <audio ref={sfxRef} src="/surprise.mp3" preload="auto" />
      <audio ref={giftSfxRef} src="/gift.mp3" preload="auto" />

      <AnimatePresence>
        {isOpen && is3DLoaded && !isPopped && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleMusic}
            className="absolute top-6 right-6 z-50 bg-white border-2 border-[#4a3b32] p-3 rounded-full shadow-[4px_4px_0px_0px_#4a3b32] hover:bg-[#ffebf0] active:translate-y-1 active:shadow-none transition-all"
          >
            {isPlaying ? <Volume2 size={24} className="text-[#4a3b32]" /> : <VolumeX size={24} className="text-gray-400" />}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          // ==============================
          // TAMPILAN KADO 3D
          // ==============================
          <motion.div
            key="kado"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}
            className="flex flex-col items-center z-10 relative"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]"
            >
              <Canvas
                className="outline-none"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                camera={{ position: [0, 2, 6], fov: 50 }}
              >
                <ambientLight intensity={1.5} color="#ffffff" />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <Suspense fallback={null}>
                  <Gift3D onClick={handleOpen} />
                </Suspense>
                <OrbitControls autoRotate autoRotateSpeed={3} enableZoom={false} />
              </Canvas>
            </motion.div>

            <motion.div
              // Hilang instan pas kado dipencet tanpa nunggu animasi kado selesai
              exit={{ opacity: 0, transition: { duration: 2 } }}
              className="mt-2 text-[#4a3b32] font-black tracking-widest text-lg bg-white px-8 py-3 rounded-full border-4 border-[#4a3b32] shadow-[6px_6px_0px_0px_#4a3b32]"
            >
              CLICK THE GIFT!
            </motion.div>
          </motion.div>
        ) : (
          // ==============================
          // TAMPILAN KUE 3D
          // ==============================
          <motion.div
            key="isi"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              backgroundColor: isPopped ? 'rgba(0, 0, 0, 0.4)' : '#ffffff',
              borderColor: isPopped ? '#3f3f46' : '#4a3b32',
              boxShadow: isPopped ? '0px 0px 0px 0px #000000' : '12px 12px 0px 0px #4a3b32'
            }}
            transition={{ duration: 1.5 }}
            className="w-full max-w-md border-4 rounded-[40px] p-8 flex flex-col items-center justify-center relative min-h-[500px] z-10 transition-colors backdrop-blur-sm"
          >

            <AnimatePresence>
              {!is3DLoaded && (
                <ProgressOverlay onLoaded={() => setIs3DLoaded(true)} />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {is3DLoaded && !isPopped && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* FIX: Ubah icon jadi tag img PNG */}
                  <motion.img
                    src="/sparkles.png"
                    alt="sparkles"
                    className="absolute top-0 left-1 w-24 h-24 object-contain"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3, // Kecepatan putaran (detik), makin kecil makin ngebut
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  <img src="/heart.png" alt="heart" className="absolute top-0 right-1 w-30 h-30 object-contain" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-full h-[300px] sm:h-[350px] mt-4 cursor-grab active:cursor-grabbing">
              <Canvas
                className="outline-none"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                camera={{ position: [0, 14, 15], fov: 50 }}
                dpr={[1, 1.5]}
                gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
              >
                <ambientLight intensity={isPopped ? 0.3 : 1.5} color="#ffffff" />
                {!isPopped && <hemisphereLight skyColor="#ffffff" groundColor="#ffebef" intensity={1.5} />}

                <directionalLight position={[0, 10, 10]} intensity={isPopped ? 0 : 2} />
                <directionalLight position={[10, 10, 5]} intensity={isPopped ? 0.2 : 1.5} />
                <directionalLight position={[-10, 10, 5]} intensity={isPopped ? 0.1 : 1.0} />
                <pointLight position={[0, 4, 10]} intensity={isPopped ? 0.5 : 0} color="#ffebef" />

                <Suspense fallback={null}>
                  <group>
                    <Cake3D />
                    <CharaVRM isTransitioning={isTransitioning} isPopped={isPopped} onClick={handleCharaClick} />
                  </group>
                </Suspense>

                <CameraController isTransitioning={isTransitioning} />

                {/* FIX: Pas isTransitioning jalan, dia mati biar kameranya bisa ditarik mulus ke atas. 
                    Pas isPopped (sad mode), dia nyala muter kaya ban dengan speed lambat (0.5) */}
                <OrbitControls
                  makeDefault
                  autoRotate={!isTransitioning}
                  autoRotateSpeed={isPopped ? 3 : 1}
                  enableZoom={false}
                />
              </Canvas>
            </div>

            <AnimatePresence mode="wait">
              {is3DLoaded && !isPopped ? (
                <motion.p
                  key="happy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 text-[#4a3b32] font-black text-xl tracking-wider text-center uppercase"
                >
                  HEPI BIRTHDAY!
                </motion.p>
              ) : isPopped ? (
                <motion.p
                  key="sad"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 2 }}
                  className="mt-6 text-white/70 font-medium text-lg tracking-widest text-center"
                >
                  happy birthday... till.
                </motion.p>
              ) : null}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

useGLTF.preload('/cake.glb');
useGLTF.preload('/gift.glb');