"use client";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Moon, Sun, Palette, PenTool, Brush, Sparkles, ArrowRight, ArrowUpRight, Menu, X, ExternalLink } from "lucide-react";
import SmoothScroll from "@/components/SmoothScroll";
import Magnetic from "@/components/Magnetic";

// --- Utility: Noise Texture for that "Film/2026" feel ---
const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.03] mix-blend-overlay" 
       style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}></div>
);

// --- Sub-Component: Fixed Theme Toggle ---
const ThemeToggle = () => {
  const [dark, setDark] = useState(() => {
    // Check if we're on client and if dark mode is preferred
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // default to dark
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (dark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
    
    // Add transition class for smooth change
    document.body.classList.add('theme-transition');
    const timer = setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [dark]);

  return (
    <Magnetic>
      <button 
        onClick={() => setDark(!dark)}
        className="relative w-12 h-12 rounded-full border border-neutral-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center overflow-hidden transition-all hover:scale-110"
        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <motion.div
          initial={false}
          animate={{ y: dark ? -30 : 0, opacity: dark ? 0 : 1 }}
          className="absolute"
        >
          <Sun size={20} className="text-orange-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{ y: dark ? 0 : 30, opacity: dark ? 1 : 0 }}
          className="absolute"
        >
          <Moon size={20} className="text-purple-400" />
        </motion.div>
      </button>
    </Magnetic>
  );
};

// --- Sub-Component: Hero Card (3D Tilt) ---
const HeroCard = ({ image, index, progress }) => {
  // Parallax and rotation based on scroll progress
  const y = useTransform(progress, [0, 1], [0, -50 * index]);
  const rotate = useTransform(progress, [0, 1], [0, (index - 1.5) * 10]);
  const scale = useTransform(progress, [0, 1], [1, 1 - (index * 0.05)]);
  
  return (
    <motion.div 
      style={{ y, rotate, scale, zIndex: 4 - index }}
      className="absolute inset-0 w-64 md:w-80 h-96 md:h-[500px] m-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-black/10 origin-bottom"
    >
      <img src={image} alt="Hero Art" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </motion.div>
  );
};

// --- Sub-Component: Exhibition Row ---
const ExhibitionRow = ({ title, location, date, image, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative border-t border-neutral-300 dark:border-white/10 py-12 cursor-pointer group"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 mix-blend-difference text-neutral-900 dark:text-white">
        <h3 className="text-4xl md:text-6xl font-black uppercase tracking-tighter transition-all duration-300 group-hover:translate-x-4">
          {title}
        </h3>
        <div className="flex items-center gap-8 md:gap-20 text-sm md:text-base font-mono uppercase tracking-widest opacity-60">
          <span>{location}</span>
          <span>{date}</span>
        </div>
      </div>

      {/* Floating Reveal Image */}
      <motion.div
        style={{ 
          x: mouseX, 
          y: mouseY, 
          translateX: "-50%", 
          translateY: "-50%",
        }}
        animate={{ 
          scale: isHovered ? 1 : 0,
          opacity: isHovered ? 1 : 0 
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
        className="absolute top-0 left-0 w-64 h-48 md:w-96 md:h-64 rounded-xl overflow-hidden pointer-events-none z-20 shadow-2xl hidden md:block"
      >
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </motion.div>
      
      {/* Mobile background reveal */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 md:hidden" />
    </motion.div>
  );
};

// --- MAIN PAGE ---
export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Refs for scroll-to
  const galleryRef = useRef(null);
  const processRef = useRef(null);
  const exhibitionsRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { setIsClient(true); }, []);

  // --- DATA ---
  const artworks = [
    { id: 1, title: "Digital Dreams", description: "Abstract geometry & organic forms.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop", colors: ["#8B5CF6", "#EC4899"] },
    { id: 2, title: "Urban Echoes", description: "Street art meets digital expression.", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop", colors: ["#3B82F6", "#EF4444"] },
    { id: 3, title: "Cosmic Harmony", description: "Astronomy and emotional expression.", image: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1200&auto=format&fit=crop", colors: ["#0EA5E9", "#8B5CF6"] },
    { id: 4, title: "Neural Pathways", description: "Consciousness and digital thought.", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop", colors: ["#6366F1", "#10B981"] }
  ];

  const processSteps = [
    { step: "01", title: "Concept", description: "Initial sketches & mood boards", icon: <Sparkles />, color: "bg-purple-500" },
    { step: "02", title: "Blueprint", description: "Digital wireframing & logic", icon: <PenTool />, color: "bg-pink-500" },
    { step: "03", title: "Palette", description: "Color psychology & harmony", icon: <Palette />, color: "bg-amber-500" },
    { step: "04", title: "Masterpiece", description: "Final execution & rendering", icon: <Brush />, color: "bg-emerald-500" }
  ];

  // Hero animation values
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroTextY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);

  return (
    <SmoothScroll>
      <main ref={containerRef} className="bg-neutral-50 dark:bg-[#050505] min-h-screen text-neutral-900 dark:text-neutral-100 transition-colors duration-500 selection:bg-purple-500/30">
        <NoiseOverlay />
        
        {/* --- NAVIGATION --- */}
        <nav className="fixed inset-x-0 top-0 p-6 md:p-8 z-50 flex justify-between items-center mix-blend-difference text-white">
          <Magnetic>
            <div className="text-xl font-bold tracking-tighter uppercase cursor-pointer flex items-center gap-2" onClick={() => window.scrollTo(0,0)}>
              <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"/> Hathim.
            </div>
          </Magnetic>
          
          <div className="hidden md:flex gap-10">
            {["Gallery", "Process", "Exhibitions", "Contact"].map((item, i) => (
              <Magnetic key={item}>
                <button 
                  onClick={() => scrollToSection([galleryRef, processRef, exhibitionsRef, contactRef][i])}
                  className="text-xs font-medium uppercase tracking-[0.2em] hover:text-purple-400 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-2 left-0 w-0 h-[1px] bg-purple-400 transition-all duration-300 group-hover:w-full" />
                </button>
              </Magnetic>
            ))}
          </div>

          {/* <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2">
                {menuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div> */}
        </nav>

        {/* --- MOBILE MENU --- */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-100%" }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              className="fixed inset-0 bg-neutral-950 z-40 flex flex-col justify-center items-center gap-8"
            >
              {["Gallery", "Process", "Exhibitions", "Contact"].map((item, i) => (
                <button 
                  key={item}
                  onClick={() => scrollToSection([galleryRef, processRef, exhibitionsRef, contactRef][i])}
                  className="text-5xl font-black uppercase tracking-tighter hover:text-purple-500 transition-colors"
                >
                  {item}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- HERO SECTION --- */}
        <section ref={heroRef} className="relative h-[150vh] flex flex-col items-center">
          <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center">
            
            {/* Background Gradient Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 dark:bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Kinetic Typography */}
            <motion.div style={{ y: heroTextY, opacity: heroOpacity }} className="relative z-10 text-center mix-blend-exclusion dark:mix-blend-normal">
              <h1 className="text-[15vw] leading-[0.8] font-black tracking-tighter text-neutral-900 dark:text-white">
                VISUAL
              </h1>
              {/* Cards inserted visually between lines via Z-index hacks or absolute positioning */}
              <div className="h-10 md:h-20" /> 
              <h1 className="text-[15vw] leading-[0.8] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                ALCHEMIST
              </h1>
            </motion.div>

            {/* Fanning Cards Deck */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center pointer-events-none">
              {artworks.map((art, i) => (
                <HeroCard key={art.id} image={art.image} index={i} progress={heroScroll} />
              ))}
            </div>

            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 1 }}
              className="absolute bottom-10 text-xs uppercase tracking-widest text-neutral-500"
            >
              Scroll to Explore
            </motion.p>
          </div>
        </section>

        {/* --- GALLERY SECTION --- */}
        <section ref={galleryRef} className="py-32 px-4 md:px-12 max-w-8xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8"
          >
            <h2 className="text-6xl md:text-9xl font-black tracking-tighter leading-none">
              SELECTED <br/> <span className="italic font-serif font-light text-neutral-400">WORKS</span>
            </h2>
            <p className="max-w-md text-lg text-neutral-500">
              A curated collection of digital artifacts exploring the boundary between algorithmic precision and human emotion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-y-24">
            {artworks.map((art, i) => (
              <motion.div
                key={art.id}
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`group relative ${i % 2 !== 0 ? 'md:mt-32' : ''}`}
              >
                {/* Image Container with Magnetic Effect on Hover */}
                <Magnetic strength={0.2}>
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden cursor-none">
                    <img 
                      src={art.image} 
                      alt={art.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                      <ArrowUpRight className="text-white" size={20} />
                    </div>
                  </div>
                </Magnetic>

                <div className="mt-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight mb-2 group-hover:text-purple-500 transition-colors">{art.title}</h3>
                    <p className="text-neutral-500">{art.description}</p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {art.colors.map((c, idx) => (
                      <div key={idx} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- HORIZONTAL PROCESS SECTION --- */}
        <section ref={processRef} className="relative py-32 bg-neutral-900 dark:bg-black text-white overflow-hidden">
           {/* Moving mesh gradient bg */}
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(120,0,255,0.3),transparent_50%)]" />
           
           <div className="container mx-auto px-4 md:px-12 mb-12">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">The <span className="text-purple-500">Algorithm</span></h2>
           </div>

           {/* Horizontal Scroll Container */}
           <div className="flex flex-col md:flex-row gap-8 px-4 md:px-12 overflow-x-auto pb-12 snap-x hide-scrollbar">
             {processSteps.map((step, i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="flex-shrink-0 w-full md:w-[400px] h-[500px] bg-neutral-800/50 border border-white/5 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden snap-center group hover:bg-neutral-800 transition-colors"
               >
                 <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-20 ${step.color}`} />
                 
                 <div className="relative z-10">
                   <div className={`w-12 h-12 rounded-full ${step.color} bg-opacity-20 flex items-center justify-center mb-8 text-white`}>
                     {step.icon}
                   </div>
                   <span className="text-8xl font-black text-white/5 absolute top-0 right-0">{step.step}</span>
                   
                   <h3 className="text-3xl font-bold mb-4">{step.title}</h3>
                   <p className="text-neutral-400 leading-relaxed">{step.description}</p>
                 </div>

                 <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-8">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: "100%" }}
                     transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                     className={`h-full ${step.color}`}
                   />
                 </div>
               </motion.div>
             ))}
           </div>
        </section>

        {/* --- EXHIBITIONS (LIST STYLE) --- */}
        <section ref={exhibitionsRef} className="py-32 px-4 md:px-12 max-w-7xl mx-auto">
          <div className="mb-24">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-4">EXHIBITIONS</h2>
            <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/10" />
          </div>

          <div className="flex flex-col">
            {[
              { title: "Digital Renaissance", location: "Tate Modern, London", date: "2024", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200" },
              { title: "Future Forms", location: "MOMA, New York", date: "2023", image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200" },
              { title: "Neon Tokyo", location: "Mori Art Museum", date: "2025", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200" }
            ].map((exhibition, i) => (
              <ExhibitionRow key={i} {...exhibition} index={i} />
            ))}
          </div>
        </section>

        {/* --- CONTACT / FOOTER --- */}
        <section ref={contactRef} className="min-h-screen flex flex-col justify-between py-20 px-4 md:px-12 bg-neutral-900 text-white relative overflow-hidden">
          {/* Background Ambient Light */}
          <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-purple-900/50 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-[12vw] font-black leading-[0.8] tracking-tighter uppercase text-center md:text-left">
              Let's <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">Create.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20 relative z-10">
            <div>
              <p className="text-2xl md:text-3xl text-neutral-400 max-w-xl leading-relaxed mb-10">
                Ready to push the boundaries of digital reality? Let's build something the world hasn't seen yet.
              </p>
              <Magnetic>
                <button className="bg-white text-black px-10 py-5 rounded-full text-lg font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all duration-300">
                  Start Project
                </button>
              </Magnetic>
            </div>

            <div className="flex flex-col gap-6 md:items-end justify-end">
              {["Instagram", "Twitter", "LinkedIn", "Email"].map((link) => (
                <a key={link} href="#" className="text-xl md:text-2xl font-mono uppercase hover:text-purple-400 flex items-center gap-2 group">
                  {link} <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          <div className="mt-20 pt-10 border-t border-neutral-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs md:text-sm font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
  
  {/* Left: Copyright & Status */}
  <div className="flex items-center gap-3">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
    </span>
    <span>© 2026 Hathim</span>
  </div>

  {/* Right: Creator Credit & Email */}
  <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
    <span className="opacity-60 hover:opacity-100 transition-opacity">
      Designed & Built by Irshad Konnola
    </span>
    
    <a 
      href="mailto:irshadkonnola.dev@gmail.com"
      className="group flex items-center gap-2 text-neutral-900 dark:text-white hover:text-purple-500 transition-colors duration-300"
    >
      <span className="hidden md:block w-px h-3 bg-neutral-300 dark:bg-white/20" />
      <span>Get in Touch </span>
      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-purple-500" />
    </a>
  </div>
</div>
        </section>

        {/* Custom Cursor */}
        {isClient && <CustomCursor />}
      </main>
    </SmoothScroll>
  );
}

// --- Custom Cursor with Blend Mode ---
const CustomCursor = () => {
  const mouse = { x: useMotionValue(0), y: useMotionValue(0) };
  
  useEffect(() => {
    const manageMouseMove = (e) => {
      mouse.x.set(e.clientX);
      mouse.y.set(e.clientY);
    }
    window.addEventListener("mousemove", manageMouseMove);
    return () => window.removeEventListener("mousemove", manageMouseMove);
  }, []);

  return (
    <motion.div 
      style={{ left: mouse.x, top: mouse.y }}
      className="fixed w-4 h-4 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference -translate-x-1/2 -translate-y-1/2 hidden md:block"
    >
      <motion.div 
        animate={{ scale: [1, 1.5, 1] }} 
        transition={{ duration: 1, repeat: Infinity }}
        className="absolute inset-0 bg-purple-500 rounded-full blur-sm opacity-50" 
      />
    </motion.div>
  );
};

// "use client";
// import { motion, useTransform, useScroll, useInView, AnimatePresence } from "framer-motion";
// import { useRef, useState, useEffect } from "react";
// import { Moon, Sun, Palette, PenTool, Brush, Sparkles, ArrowRight, ChevronRight, Menu, X, ExternalLink } from "lucide-react";
// import SmoothScroll from "@/components/SmoothScroll";
// import Magnetic from "@/components/Magnetic";

// // --- Sub-Component: Fixed Theme Toggle (No Random Values) ---
// const ThemeToggle = () => {
//   const [dark, setDark] = useState(true);
//   const [isHovered, setIsHovered] = useState(false);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   useEffect(() => {
//     if (isClient) {
//       document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
//       document.body.classList.add('theme-transition');
//       const timer = setTimeout(() => document.body.classList.remove('theme-transition'), 500);
//       return () => clearTimeout(timer);
//     }
//   }, [dark, isClient]);

//   return (
//     <Magnetic>
//       <motion.button 
//         onClick={() => setDark(!dark)}
//         onHoverStart={() => setIsHovered(true)}
//         onHoverEnd={() => setIsHovered(false)}
//         className="relative p-4 rounded-full border border-white/10 bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl transition-all hover:shadow-2xl overflow-hidden group"
//         animate={{
//           scale: isHovered ? 1.1 : 1,
//           rotate: isHovered ? (dark ? 10 : -10) : 0
//         }}
//       >
//         {/* Fixed particle positions - No Math.random */}
//         <AnimatePresence>
//           {isHovered && (
//             <>
//               {[0, 1, 2].map((i) => (
//                 <motion.div
//                   key={i}
//                   initial={{ opacity: 0, scale: 0 }}
//                   animate={{ 
//                     opacity: [0, 1, 0],
//                     scale: [0, 1, 0],
//                     x: i === 0 ? -10 : i === 1 ? 10 : 0,
//                     y: i === 0 ? -10 : i === 1 ? 10 : 0
//                   }}
//                   transition={{ duration: 0.6, delay: i * 0.1 }}
//                   className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20"
//                 />
//               ))}
//             </>
//           )}
//         </AnimatePresence>
        
//         {/* Icons with transitions */}
//         <div className="relative z-10">
//           <motion.div
//             animate={{ rotate: dark ? 0 : 360, opacity: dark ? 1 : 0 }}
//             transition={{ duration: 0.5 }}
//             className="absolute inset-0 flex items-center justify-center"
//           >
//             <Sun size={18} />
//           </motion.div>
//           <motion.div
//             animate={{ rotate: dark ? -360 : 0, opacity: dark ? 0 : 1 }}
//             transition={{ duration: 0.5 }}
//           >
//             <Moon size={18} />
//           </motion.div>
//         </div>
//       </motion.button>
//     </Magnetic>
//   );
// };

// // --- Sub-Component: Fixed Artwork Card (No Random Values) ---
// const ArtworkCard = ({ image, title, description, colors }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
//   const cardRef = useRef(null);

//   const handleMouseMove = (e) => {
//     if (!cardRef.current) return;
//     const rect = cardRef.current.getBoundingClientRect();
//     const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
//     const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
//     setMousePosition({ x, y });
//   };

//   return (
//     <motion.div
//       ref={cardRef}
//       initial={{ opacity: 0, y: 50 }}
//       whileInView={{ opacity: 1, y: 0 }}
//       viewport={{ once: true, margin: "-50px" }}
//       whileHover="hovered"
//       onMouseMove={handleMouseMove}
//       onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
//       className="relative group cursor-pointer"
//       onClick={() => setIsExpanded(!isExpanded)}
//     >
//       {/* Animated gradient border */}
//       <motion.div
//         animate={{
//           backgroundPosition: isExpanded ? "100% 50%" : "0% 50%"
//         }}
//         transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
//         className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 opacity-0 group-hover:opacity-100 blur-sm transition duration-500"
//       />
      
//       <motion.div
//         variants={{
//           hovered: {
//             rotateY: mousePosition.x,
//             rotateX: -mousePosition.y,
//             transition: { type: "spring", stiffness: 300, damping: 20 }
//           }
//         }}
//         className="relative bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden p-6 md:p-8 transform-gpu"
//         style={{
//           transformStyle: "preserve-3d",
//           perspective: 1000
//         }}
//       >
//         {/* Color palette preview */}
//         <div className="absolute top-4 right-4 md:top-6 md:right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
//           {colors?.map((color, i) => (
//             <motion.div
//               key={i}
//               initial={{ width: 0 }}
//               animate={{ width: 16 }}
//               transition={{ delay: i * 0.1 }}
//               className="h-1 rounded-full"
//               style={{ backgroundColor: color }}
//             />
//           ))}
//         </div>

//         {/* Artwork image */}
//         <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden mb-6">
//           <motion.div
//             animate={{ scale: isExpanded ? 1.05 : 1 }}
//             transition={{ duration: 0.5, ease: "easeOut" }}
//             className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20"
//           />
//           <img
//             src={image}
//             alt={title}
//             className="w-full h-full object-cover transform-gpu group-hover:scale-110 transition-transform duration-500"
//             loading="lazy"
//           />
          
//           {/* Fixed sparkle positions */}
//           <AnimatePresence>
//             {isExpanded && (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="absolute inset-0"
//               >
//                 {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
//                   <motion.div
//                     key={i}
//                     initial={{ opacity: 0, scale: 0 }}
//                     animate={{ 
//                       opacity: [0, 1, 0],
//                       scale: [0, 1, 0],
//                       x: [0, 30, 60, 90][i % 4] - 50,
//                       y: [0, 30, 60, 90][Math.floor(i / 2)] - 50
//                     }}
//                     transition={{ 
//                       duration: 1.5,
//                       delay: i * 0.2,
//                       repeat: Infinity,
//                       repeatDelay: i % 2 ? 1 : 0.5
//                     }}
//                     className="absolute w-1 h-1 bg-white rounded-full"
//                     style={{
//                       left: `${(i * 12.5 + 10)}%`,
//                       top: `${(i * 12.5 + 10)}%`,
//                     }}
//                   />
//                 ))}
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tighter">{title}</h3>
//         <motion.p
//           animate={{ height: isExpanded ? "auto" : "0px", opacity: isExpanded ? 1 : 0 }}
//           className="text-neutral-400 text-sm overflow-hidden"
//         >
//           {description}
//         </motion.p>

//         {/* Expand indicator */}
//         <motion.div
//           animate={{ rotate: isExpanded ? 45 : 0 }}
//           className="absolute bottom-4 right-4 md:bottom-6 md:right-6 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center"
//         >
//           <ChevronRight size={16} />
//         </motion.div>
//       </motion.div>
//     </motion.div>
//   );
// };

// // --- Sub-Component: Fixed Fluid Background (No Random Values) ---
// const FluidBackground = () => {
//   const containerRef = useRef(null);

//   return (
//     <div ref={containerRef} className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
//       <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
//         <defs>
//           <linearGradient id="fluidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//             <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.1" />
//             <stop offset="50%" stopColor="#EC4899" stopOpacity="0.05" />
//             <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
//           </linearGradient>
//         </defs>
        
//         <motion.rect
//           width="100"
//           height="100"
//           fill="url(#fluidGradient)"
//           animate={{
//             x: [0, 5, 0],
//             y: [0, 3, 0],
//           }}
//           transition={{
//             duration: 15,
//             repeat: Infinity,
//             ease: "easeInOut"
//           }}
//         />
//       </svg>

//       {/* Fixed position particles */}
//       {[
//         { left: "10%", top: "20%", delay: 0 },
//         { left: "85%", top: "15%", delay: 1 },
//         { left: "25%", top: "75%", delay: 2 },
//         { left: "90%", top: "80%", delay: 3 },
//         { left: "50%", top: "40%", delay: 4 },
//       ].map((particle, i) => (
//         <motion.div
//           key={i}
//           className="absolute w-1 h-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full"
//           animate={{
//             y: [0, -10, 0],
//             scale: [0.5, 0.8, 0.5]
//           }}
//           transition={{
//             duration: 3 + i,
//             repeat: Infinity,
//             ease: "easeInOut",
//             delay: particle.delay
//           }}
//           style={{
//             left: particle.left,
//             top: particle.top,
//           }}
//         />
//       ))}
//     </div>
//   );
// };

// // --- MAIN PAGE ---
// export default function Home() {
//   const [activeSection, setActiveSection] = useState("gallery");
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // Fixed artworks data
//   const artworks = [
//     {
//       id: 1,
//       title: "Digital Dreams",
//       description: "A fusion of abstract geometry and organic forms, created using custom algorithms.",
//       image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1200&auto=format&fit=crop",
//       colors: ["#8B5CF6", "#EC4899", "#F59E0B", "#10B981"]
//     },
//     {
//       id: 2,
//       title: "Urban Echoes",
//       description: "Street art meets digital expression in this vibrant cityscape interpretation.",
//       image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop",
//       colors: ["#3B82F6", "#EF4444", "#84CC16", "#8B5CF6"]
//     },
//     {
//       id: 3,
//       title: "Cosmic Harmony",
//       description: "Exploring the intersection of astronomy and emotional expression through color.",
//       image: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=1200&auto=format&fit=crop",
//       colors: ["#0EA5E9", "#8B5CF6", "#EC4899", "#F59E0B"]
//     },
//     {
//       id: 4,
//       title: "Neural Pathways",
//       description: "Visual representation of consciousness and digital thought processes.",
//       image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop",
//       colors: ["#6366F1", "#10B981", "#F59E0B", "#EC4899"]
//     }
//   ];

//   const processSteps = [
//     {
//       step: "01",
//       title: "Conceptualization",
//       description: "Initial sketches and mood boards that capture the essence of the idea",
//       icon: <Sparkles />,
//       color: "#8B5CF6"
//     },
//     {
//       step: "02",
//       title: "Digital Sketching",
//       description: "Transforming concepts into detailed digital blueprints",
//       icon: <PenTool />,
//       color: "#EC4899"
//     },
//     {
//       step: "03",
//       title: "Color Exploration",
//       description: "Experimental phase focusing on color psychology and harmony",
//       icon: <Palette />,
//       color: "#F59E0B"
//     },
//     {
//       step: "04",
//       title: "Final Execution",
//       description: "Bringing all elements together into a cohesive masterpiece",
//       icon: <Brush />,
//       color: "#10B981"
//     }
//   ];

//   return (
//     <SmoothScroll>
//       <main className="relative overflow-hidden">
//         {/* Fluid Background */}
//         <FluidBackground />
        
//         {/* HUD Navigation */}
//         <nav className="fixed inset-x-0 top-0 p-6 md:p-10 z-[100] flex justify-between items-center pointer-events-none">
//           <div className="pointer-events-auto flex items-center gap-4">
//             <Magnetic>
//               <motion.h1 
//                 whileHover={{ scale: 1.1 }}
//                 className="text-lg font-black tracking-tighter cursor-pointer uppercase flex items-center gap-2"
//               >
//                 <motion.span 
//                   animate={{ rotate: [0, 10, -10, 0] }}
//                   transition={{ duration: 2, repeat: Infinity }}
//                 >
//                   ✦
//                 </motion.span>
//                 Hathim.
//               </motion.h1>
//             </Magnetic>
//             <ThemeToggle />
//           </div>
          
//           {/* Mobile Menu Toggle */}
//           <div className="pointer-events-auto md:hidden">
//             <Magnetic>
//               <motion.button
//                 onClick={() => setMenuOpen(!menuOpen)}
//                 className="p-3 rounded-full border border-white/10 backdrop-blur-md"
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <AnimatePresence mode="wait">
//                   {menuOpen ? (
//                     <motion.div
//                       key="close"
//                       initial={{ rotate: -90, opacity: 0 }}
//                       animate={{ rotate: 0, opacity: 1 }}
//                       exit={{ rotate: 90, opacity: 0 }}
//                     >
//                       <X size={20} />
//                     </motion.div>
//                   ) : (
//                     <motion.div
//                       key="menu"
//                       initial={{ rotate: 90, opacity: 0 }}
//                       animate={{ rotate: 0, opacity: 1 }}
//                       exit={{ rotate: -90, opacity: 0 }}
//                     >
//                       <Menu size={20} />
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </motion.button>
//             </Magnetic>
//           </div>

//           {/* Desktop Navigation */}
//           <div className="pointer-events-auto hidden md:flex gap-10">
//             {["Gallery", "Process", "Studio", "Exhibitions"].map((item) => (
//               <Magnetic key={item}>
//                 <motion.div
//                   className="relative"
//                   onHoverStart={() => setActiveSection(item.toLowerCase())}
//                 >
//                   <span className="text-[10px] uppercase tracking-[0.3em] cursor-pointer hover:opacity-100 transition-opacity relative z-10">
//                     {item}
//                   </span>
//                   {activeSection === item.toLowerCase() && (
//                     <motion.div
//                       layoutId="navIndicator"
//                       className="absolute inset-0 bg-white/10 rounded-full -z-10"
//                       initial={false}
//                       transition={{ type: "spring", stiffness: 300, damping: 25 }}
//                     />
//                   )}
//                 </motion.div>
//               </Magnetic>
//             ))}
//           </div>
          
//           <div className="pointer-events-auto hidden md:block">
//             <Magnetic>
//               <motion.button 
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//                 className="relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold overflow-hidden group"
//               >
//                 <span className="relative z-10 flex items-center gap-2">
//                   Collaborate
//                   <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
//                 </span>
//               </motion.button>
//             </Magnetic>
//           </div>
//         </nav>

//         {/* Mobile Menu */}
//         <AnimatePresence>
//           {menuOpen && (
//             <motion.div
//               initial={{ opacity: 0, y: -20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="fixed inset-0 z-[99] md:hidden flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl"
//               onClick={() => setMenuOpen(false)}
//             >
//               {["Gallery", "Process", "Studio", "Exhibitions", "Contact"].map((item, i) => (
//                 <motion.div
//                   key={item}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: i * 0.1 }}
//                   className="text-4xl font-bold my-4 cursor-pointer hover:text-purple-500 transition-colors"
//                 >
//                   {item}
//                 </motion.div>
//               ))}
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* SECTION 1: HERO SECTION (Replaced Horizontal with Vertical) */}
//         <section className="min-h-screen flex flex-col justify-center px-6 md:px-20 pt-20">
//           <div className="max-w-7xl mx-auto w-full">
//             <motion.div
//               initial={{ opacity: 0, y: 50 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8 }}
//               className="mb-20"
//             >
//               <h1 className="text-6xl md:text-8xl lg:text-[10vw] font-black leading-[0.8] tracking-tighter uppercase mb-8">
//                 Visual <br/> 
//                 <motion.span 
//                   className="italic font-light bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent"
//                   animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
//                   transition={{ duration: 5, repeat: Infinity }}
//                 >
//                   Alchemist
//                 </motion.span>
//               </h1>
              
//               <motion.p 
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.3 }}
//                 className="text-xl md:text-2xl text-neutral-500 max-w-2xl leading-relaxed mb-12"
//               >
//                 Transforming emotions into visual symphonies through digital innovation and traditional mastery.
//               </motion.p>

//               <Magnetic>
//                 <motion.button 
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-sm uppercase tracking-widest font-bold"
//                 >
//                   Explore Gallery
//                 </motion.button>
//               </Magnetic>
//             </motion.div>

//             {/* Artwork Grid (Replaces Horizontal Scroll) */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
//               {artworks.map((artwork, index) => (
//                 <motion.div 
//                   key={artwork.id}
//                   initial={{ opacity: 0, y: 50 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.1 + 0.2 }}
//                 >
//                   <ArtworkCard {...artwork} />
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* SECTION 2: CREATIVE PROCESS */}
//         <section className="py-40 px-6 md:px-20 relative">
//           <div className="max-w-7xl mx-auto">
//             <motion.div
//               initial={{ opacity: 0 }}
//               whileInView={{ opacity: 1 }}
//               viewport={{ margin: "-100px" }}
//               className="text-center mb-20"
//             >
//               <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter">
//                 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
//                   The Process
//                 </span>
//               </h2>
//               <p className="text-xl text-neutral-500 max-w-2xl mx-auto">
//                 A journey from concept to creation, where every step is as important as the final piece.
//               </p>
//             </motion.div>

//             {/* Process Timeline */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {processSteps.map((step, index) => (
//                 <motion.div
//                   key={step.step}
//                   initial={{ opacity: 0, y: 50 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   viewport={{ once: true, margin: "-50px" }}
//                   transition={{ delay: index * 0.1 }}
//                   className="relative"
//                 >
//                   <div className="relative p-6 md:p-8 border border-white/5 bg-white/5 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-all duration-500 h-full">
//                     {/* Step number */}
//                     <div 
//                       className="absolute -top-4 -left-4 text-5xl md:text-6xl font-black opacity-10"
//                       style={{ color: step.color }}
//                     >
//                       {step.step}
//                     </div>

//                     {/* Icon */}
//                     <motion.div
//                       whileHover={{ scale: 1.1, rotate: 5 }}
//                       transition={{ duration: 0.3 }}
//                       className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6"
//                       style={{ 
//                         background: `linear-gradient(135deg, ${step.color}20, ${step.color}40)`,
//                         border: `1px solid ${step.color}30`
//                       }}
//                     >
//                       <div style={{ color: step.color }}>
//                         {step.icon}
//                       </div>
//                     </motion.div>

//                     <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tighter">{step.title}</h3>
//                     <p className="text-neutral-400 text-sm leading-relaxed">{step.description}</p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* SECTION 3: EXHIBITIONS */}
//         <section className="py-40 px-6 md:px-20 relative">
//           <div className="max-w-7xl mx-auto">
//             <div className="flex flex-col md:flex-row justify-between items-start mb-20">
//               <div className="md:w-1/2 mb-8 md:mb-0">
//                 <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
//                   Recent <br/>
//                   <span className="text-neutral-400">Exhibitions</span>
//                 </h2>
//               </div>
//               <div className="md:w-1/2">
//                 <p className="text-xl text-neutral-500">
//                   Showcasing innovation in digital art across global platforms and exhibitions that redefine creative boundaries.
//                 </p>
//               </div>
//             </div>

//             {/* Exhibition Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//               {[
//                 {
//                   title: "Digital Renaissance",
//                   location: "Tate Modern, London",
//                   date: "2024",
//                   image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1200&auto=format&fit=crop"
//                 },
//                 {
//                   title: "Future Forms",
//                   location: "MOMA, New York",
//                   date: "2023",
//                   image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1200&auto=format&fit=crop"
//                 }
//               ].map((exhibition, index) => (
//                 <motion.div
//                   key={exhibition.title}
//                   initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   viewport={{ once: true }}
//                   className="group relative overflow-hidden rounded-3xl"
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30 z-10" />
//                   <img 
//                     src={exhibition.image} 
//                     alt={exhibition.title}
//                     className="w-full h-64 md:h-96 object-cover transform group-hover:scale-110 transition-transform duration-500"
//                     loading="lazy"
//                   />
//                   <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-20 bg-gradient-to-t from-black/80 to-transparent">
//                     <div className="flex justify-between items-end">
//                       <div>
//                         <h3 className="text-2xl md:text-3xl font-bold mb-2">{exhibition.title}</h3>
//                         <p className="text-neutral-300">{exhibition.location}</p>
//                       </div>
//                       <span className="text-3xl md:text-4xl font-black opacity-30">{exhibition.date}</span>
//                     </div>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           </div>
//         </section>

//         {/* SECTION 4: COLOR PLAYGROUND */}
//         <section className="py-40 px-6 md:px-20 relative">
//           <div className="max-w-7xl mx-auto text-center">
//             <motion.h2 
//               initial={{ filter: "blur(10px)", opacity: 0 }}
//               whileInView={{ filter: "blur(0px)", opacity: 1 }}
//               className="text-5xl md:text-7xl lg:text-[10vw] font-black mb-8 tracking-tighter leading-none"
//             >
//               Play with <br/>
//               <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
//                 Color
//               </span>
//             </motion.h2>
            
//             {/* Interactive Color Mixer */}
//             <motion.div 
//               className="relative h-48 md:h-64 lg:h-80 rounded-3xl overflow-hidden mx-auto max-w-4xl my-12 md:my-20"
//               initial={{ opacity: 0 }}
//               whileInView={{ opacity: 1 }}
//             >
//               <div className="absolute inset-0 flex">
//                 {["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6"].map((color, i) => (
//                   <motion.div
//                     key={i}
//                     className="flex-1 h-full cursor-pointer"
//                     style={{ backgroundColor: color }}
//                     whileHover={{ flex: 1.5 }}
//                     transition={{ type: "spring", stiffness: 300 }}
//                   />
//                 ))}
//               </div>
//             </motion.div>

//             <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-20">
//               Explore color combinations that inspire the creative process.
//             </p>
//           </div>
//         </section>

//         {/* FINAL SECTION: CONTACT */}
//         <footer className="min-h-screen relative flex flex-col justify-center items-center text-center px-6">
//           {/* Animated gradient orb */}
//           <motion.div
//             animate={{
//               scale: [1, 1.1, 1],
//             }}
//             transition={{
//               duration: 15,
//               repeat: Infinity,
//               ease: "linear"
//             }}
//             className="absolute w-full max-w-[600px] h-[600px] rounded-full bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-amber-600/10 blur-3xl -z-10"
//           />
          
//           <motion.h2 
//             initial={{ filter: "blur(10px)", opacity: 0 }}
//             whileInView={{ filter: "blur(0px)", opacity: 1 }}
//             className="text-5xl md:text-7xl lg:text-[10vw] font-black uppercase tracking-tighter leading-none mb-6 md:mb-10"
//           >
//             Let's Create <br/>
//             <motion.span
//               animate={{ 
//                 backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
//               }}
//               transition={{ 
//                 duration: 5, 
//                 repeat: Infinity,
//                 ease: "linear"
//               }}
//               className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 bg-clip-text text-transparent bg-[length:200%_auto]"
//             >
//               Together
//             </motion.span>
//           </motion.h2>
          
//           <motion.p
//             initial={{ opacity: 0, y: 20 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-12 md:mb-16"
//           >
//             Ready to bring your vision to life? Let's collaborate on something extraordinary.
//           </motion.p>
          
//           <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-12 md:mb-20">
//             {["Instagram", "Behance", "LinkedIn", "Email"].map((platform, i) => (
//               <Magnetic key={platform}>
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   whileInView={{ opacity: 1, y: 0 }}
//                   transition={{ delay: i * 0.1 }}
//                   whileHover={{ scale: 1.05 }}
//                   className="relative group"
//                 >
//                   <span className="relative text-base md:text-lg font-medium tracking-wide px-6 py-3 md:px-8 md:py-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm cursor-pointer inline-flex items-center gap-3">
//                     {platform}
//                     <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
//                   </span>
//                 </motion.div>
//               </Magnetic>
//             ))}
//           </div>

//           {/* Signature */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             whileInView={{ opacity: 1 }}
//             transition={{ delay: 0.5 }}
//             className="mt-12 md:mt-20 pt-12 md:pt-20 border-t border-white/10 w-full max-w-4xl mx-auto"
//           >
//             <div className="text-center">
//               <div className="text-2xl md:text-3xl mb-4">
//                 ✦
//               </div>
//               <p className="text-xs md:text-sm text-neutral-500 tracking-widest">
//                 CRAFTED WITH PASSION • 2024 • DIGITAL ARTISTRY
//               </p>
//             </div>
//           </motion.div>
//         </footer>

//         {/* Custom Cursor - Only render on client */}
//         {isClient && <CustomCursor />}
//       </main>
//     </SmoothScroll>
//   );
// }

// // --- Custom Cursor ---
// const CustomCursor = () => {
//   const [position, setPosition] = useState({ x: 0, y: 0 });
//   const [isClient, setIsClient] = useState(false);
  
//   useEffect(() => {
//     setIsClient(true);
//     const move = (e) => {
//       if (isClient) {
//         setPosition({ x: e.clientX, y: e.clientY });
//       }
//     };
    
//     window.addEventListener("mousemove", move);
//     return () => window.removeEventListener("mousemove", move);
//   }, [isClient]);

//   if (!isClient) return null;

//   return (
//     <>
//       <motion.div 
//         className="fixed top-0 left-0 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full pointer-events-none z-[999] mix-blend-difference"
//         animate={{ 
//           x: position.x - 12, 
//           y: position.y - 12,
//         }}
//         transition={{ 
//           type: "spring", 
//           stiffness: 500, 
//           damping: 28, 
//           mass: 0.5 
//         }}
//       />
//       <motion.div 
//         className="fixed top-0 left-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full pointer-events-none z-[1000]"
//         animate={{ 
//           x: position.x - 3, 
//           y: position.y - 3,
//         }}
//         transition={{ 
//           type: "spring", 
//           stiffness: 800, 
//           damping: 30, 
//           mass: 0.3 
//         }}
//       />
//     </>
//   );
// };