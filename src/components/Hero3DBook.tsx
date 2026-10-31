import React from 'react';
import Image from 'next/image';
import { Sparkles, Brain, Flame } from 'lucide-react';

export default function Hero3DBook() {
    return (
        <div className="relative w-full max-w-lg mx-auto py-10 lg:py-0 select-none">
            {/* AMBIENT GLOW BACKDROPS */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-red-600/25 rounded-full blur-[100px] pointer-events-none -z-10 animate-pulse"></div>
            <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-amber-500/20 rounded-full blur-[90px] pointer-events-none -z-10"></div>

            {/* 3D SCENE CONTAINER */}
            <div className="relative [perspective:1400px] flex items-center justify-center min-h-[480px]">
                
                {/* SECONDARY BOOK (PEEKING FROM BEHIND IN 3D DEPTH) */}
                <div 
                    className="absolute w-[240px] sm:w-[270px] aspect-[1/1.45] rounded-xl overflow-hidden shadow-2xl transition-all duration-700 ease-out hidden sm:block opacity-65 hover:opacity-90"
                    style={{
                        transform: 'rotateY(-24deg) rotateX(12deg) rotateZ(-3deg) translate3d(-70px, 15px, -80px)',
                        boxShadow: '-25px 35px 50px rgba(0, 0, 0, 0.85), 0 0 40px rgba(220, 38, 38, 0.2)'
                    }}
                >
                    <Image
                        src="/covers/overcoming-mental-blocks.png"
                        alt="Overcoming Mental Blocks Book Cover"
                        fill
                        className="object-cover"
                        sizes="280px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-white/10 pointer-events-none"></div>
                </div>

                {/* PRIMARY 3D HARDCOVER BOOK (THE FLAGSHIP: COMPETITION PROTOCOL) */}
                <div 
                    className="group relative w-[260px] sm:w-[300px] aspect-[1/1.45] rounded-2xl cursor-pointer transition-all duration-500 ease-out hover:scale-[1.03]"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: 'rotateY(-18deg) rotateX(10deg) rotateZ(1deg)',
                        boxShadow: '-30px 40px 60px -10px rgba(0, 0, 0, 0.9), 0 0 60px rgba(239, 68, 68, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                    }}
                >
                    {/* 3D SPINE HIGHLIGHT (LEFT EDGE DEPTH) */}
                    <div 
                        className="absolute -left-[14px] top-0 bottom-0 w-[18px] rounded-l-md bg-gradient-to-r from-red-950 via-zinc-900 to-red-900/60 shadow-inner"
                        style={{
                            transform: 'rotateY(-90deg) translateX(-9px)',
                        }}
                    ></div>

                    {/* 3D THICK PAGES SIMULATION (RIGHT EDGE) */}
                    <div 
                        className="absolute -right-[12px] top-2 bottom-2 w-[14px] rounded-r-sm bg-gradient-to-r from-zinc-200 via-amber-50 to-zinc-400 opacity-90 shadow-md"
                        style={{
                            transform: 'rotateY(90deg) translateX(7px)',
                            backgroundImage: 'repeating-linear-gradient(to bottom, #d4d4d8 0px, #ffffff 1px, #d4d4d8 2px)'
                        }}
                    ></div>

                    {/* FRONT COVER ART */}
                    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/20 bg-zinc-950">
                        <Image
                            src="/covers/the-competition-protocol.png"
                            alt="The Competition Protocol Flagship 3D Book"
                            fill
                            priority
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 640px) 260px, 300px"
                        />
                        {/* SPECULAR LIGHTING REFLECTION OVERLAY */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none"></div>
                        
                        {/* CORNER EDITION BADGE */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-black uppercase tracking-widest text-white/90">
                            <span className="bg-red-600/90 text-white px-2.5 py-1 rounded shadow-md border border-red-400/30">
                                Flagship Master Edition
                            </span>
                            <span className="text-amber-400 drop-shadow flex items-center gap-1 font-black">
                                <Sparkles className="w-3.5 h-3.5" /> 2026
                            </span>
                        </div>
                    </div>

                    {/* SOFT GROUND SHADOW */}
                    <div 
                        className="absolute -bottom-10 left-5 right-5 h-8 bg-black/70 rounded-full blur-xl pointer-events-none"
                        style={{ transform: 'rotateX(85deg) translateZ(-40px)' }}
                    ></div>
                </div>

                {/* 3D FLOATING ORBITAL GLASS BADGE 1: BRAIN / VAGAL RESET (TOP RIGHT) */}
                <div 
                    className="absolute -top-4 -right-2 sm:-right-6 z-20 bg-zinc-900/85 backdrop-blur-xl border border-amber-500/40 px-4 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center gap-3 transition-transform duration-500 hover:scale-105"
                    style={{
                        transform: 'translateZ(60px)',
                    }}
                >
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-400">
                            Neuroscience Backed
                        </div>
                        <div className="text-xs font-black text-white">
                            Autonomic Vagal Reset
                        </div>
                    </div>
                </div>

                {/* 3D FLOATING ORBITAL GLASS BADGE 2: 7-DAY SYSTEM (BOTTOM LEFT) */}
                <div 
                    className="absolute -bottom-6 -left-2 sm:-left-6 z-20 bg-zinc-900/85 backdrop-blur-xl border border-red-500/40 px-4 py-3 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] flex items-center gap-3 transition-transform duration-500 hover:scale-105"
                    style={{
                        transform: 'translateZ(70px)',
                    }}
                >
                    <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-inner">
                        <Flame className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">
                            Zero Choking
                        </div>
                        <div className="text-xs font-black text-white">
                            7-Day Competition Protocol
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
