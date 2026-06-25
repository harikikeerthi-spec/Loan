"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface FunnelStage {
    stage: string;
    count: number;
    pct: number;
    color: string; // bg-blue-500, etc.
}

interface WebGLUnderwritingPipelineProps {
    stages: FunnelStage[];
    activeCases?: number;
}

export default function WebGLUnderwritingPipeline({ stages, activeCases = 1 }: WebGLUnderwritingPipelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; stage: string; count: number; pct: number; phase: number } | null>(null);

    const stagesRef = useRef(stages);
    useEffect(() => {
        stagesRef.current = stages;
    }, [stages]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;

        // --- Three.js Scene Setup ---
        const scene = new THREE.Scene();
        scene.background = null;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            40,
            container.clientWidth / container.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 1.8, 9);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // --- Lights ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight1 = new THREE.PointLight(0x8b24e5, 1.5, 12);
        pointLight1.position.set(-2, 3, 2);
        scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x10b981, 1.0, 12);
        pointLight2.position.set(2, -2, 2);
        scene.add(pointLight2);

        // --- 3D undulating pipeline track curve ---
        const curvePoints = [
            new THREE.Vector3(-4.8, 0.2, 0),
            new THREE.Vector3(-2.4, -0.4, 0.4),
            new THREE.Vector3(0.0, 0.5, -0.4),
            new THREE.Vector3(2.4, -0.3, 0.4),
            new THREE.Vector3(4.8, 0.3, 0)
        ];

        const curve = new THREE.CatmullRomCurve3(curvePoints);

        // Render main pipeline tube (glass-like structure)
        const pipeGeo = new THREE.TubeGeometry(curve, 64, 0.08, 12, false);
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0x6605c7,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.35,
            wireframe: false
        });
        const pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        scene.add(pipeMesh);

        // Inner glowing core line representing pipeline path
        const coreGeo = new THREE.TubeGeometry(curve, 64, 0.015, 6, false);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x8b24e5,
            transparent: true,
            opacity: 0.6
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        scene.add(coreMesh);

        // --- Stages Nodes (Spheres) ---
        // Colors mapping to stage index
        const nodeColors = [
            0x3b82f6, // Phase 1: Blue
            0xa855f7, // Phase 2: Purple
            0x4f46e5, // Phase 3: Indigo
            0x6605c7, // Phase 4: Violet
            0x10b981  // Phase 5: Emerald
        ];

        const sphereGeo = new THREE.SphereGeometry(0.24, 32, 32);
        const nodes: THREE.Mesh[] = [];

        curvePoints.forEach((pt, index) => {
            const sphereMat = new THREE.MeshStandardMaterial({
                color: nodeColors[index] || 0x6605c7,
                roughness: 0.1,
                metalness: 0.7,
                emissive: nodeColors[index] || 0x6605c7,
                emissiveIntensity: 0.8
            });

            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.copy(pt);
            scene.add(sphere);
            nodes.push(sphere);
        });

        // --- Animating fluid pulses (Glowing Orbs) ---
        const pulseCount = Math.max(1, Math.min(5, activeCases * 2));
        const pulseOrbs: THREE.Mesh[] = [];
        
        const pulseGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const pulseMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
        });

        const pulseLights: THREE.PointLight[] = [];

        for (let i = 0; i < pulseCount; i++) {
            const orb = new THREE.Mesh(pulseGeo, pulseMat.clone());
            scene.add(orb);
            pulseOrbs.push(orb);

            const pLight = new THREE.PointLight(0xa855f7, 2.5, 2.0);
            scene.add(pLight);
            pulseLights.push(pLight);
        }

        // --- Proximity / Raycaster Hover interaction ---
        const mouse = new THREE.Vector2();
        let currentHoverIdx: number | null = null;

        const onMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            let closestIdx = -1;
            let minDistance = 0.45;

            nodes.forEach((node, idx) => {
                const tempV = new THREE.Vector3();
                node.getWorldPosition(tempV);
                tempV.project(camera);

                const dx = tempV.x - mouse.x;
                const dy = tempV.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance) {
                    minDistance = dist;
                    closestIdx = idx;
                }
            });

            if (closestIdx !== currentHoverIdx) {
                currentHoverIdx = closestIdx;
                setHoveredIndex(closestIdx);

                if (closestIdx !== -1) {
                    const dataPt = stagesRef.current[closestIdx];
                    const pos = curvePoints[closestIdx];

                    const tooltipPos = new THREE.Vector3();
                    nodes[closestIdx].getWorldPosition(tooltipPos);
                    tooltipPos.project(camera);

                    const x = (tooltipPos.x * 0.5 + 0.5) * rect.width;
                    const y = (-(tooltipPos.y * 0.5) + 0.5) * rect.height;

                    setTooltip({
                        x,
                        y,
                        stage: dataPt?.stage || `Stage ${closestIdx + 1}`,
                        count: dataPt?.count ?? 0,
                        pct: dataPt?.pct ?? 0,
                        phase: closestIdx + 1
                    });
                } else {
                    setTooltip(null);
                }
            } else if (closestIdx !== -1 && tooltip) {
                const tooltipPos = new THREE.Vector3();
                nodes[closestIdx].getWorldPosition(tooltipPos);
                tooltipPos.project(camera);
                const x = (tooltipPos.x * 0.5 + 0.5) * rect.width;
                const y = (-(tooltipPos.y * 0.5) + 0.5) * rect.height;
                setTooltip(prev => prev ? { ...prev, x, y } : null);
            }
        };

        const onMouseLeave = () => {
            currentHoverIdx = null;
            setHoveredIndex(null);
            setTooltip(null);
        };

        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseleave", onMouseLeave);

        // --- Render loop / Animation ---
        let animationFrameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            pulseOrbs.forEach((orb, i) => {
                const timeOffset = i * (1.0 / pulseCount);
                const speed = 0.15;
                const progress = (elapsedTime * speed + timeOffset) % 1.0;
                
                const pos = curve.getPointAt(progress);
                orb.position.copy(pos);

                const pLight = pulseLights[i];
                pLight.position.copy(pos);
                pLight.intensity = 1.5 + Math.sin(elapsedTime * 6.0 + i) * 0.5;

                const scale = 0.75 + Math.sin(elapsedTime * 10 + i) * 0.25;
                orb.scale.set(scale, scale, scale);
            });

            nodes.forEach((node, idx) => {
                const isHovered = idx === currentHoverIdx;
                const targetScale = isHovered ? 1.4 : 1.0;
                node.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);

                const mat = node.material as THREE.MeshStandardMaterial;
                const targetEmissive = isHovered ? 2.2 : 0.8;
                mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.12;

                node.position.y = curvePoints[idx].y + Math.sin(elapsedTime * 2.5 + idx) * 0.03;
            });

            camera.position.x = Math.sin(elapsedTime * 0.5) * 0.25;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        animate();

        // --- Resize handler ---
        const handleResize = () => {
            if (!containerRef.current || !canvasRef.current) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(container);

        // --- Cleanup ---
        return () => {
            cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            resizeObserver.disconnect();

            scene.traverse((object) => {
                if (!(object instanceof THREE.Mesh)) return;
                
                object.geometry.dispose();

                if (Array.isArray(object.material)) {
                    object.material.forEach((material) => material.dispose());
                } else {
                    object.material.dispose();
                }
            });
            renderer.dispose();
        };
    }, [activeCases]);

    return (
        <div ref={containerRef} className="relative w-full h-full min-h-[160px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
            {hoveredIndex !== null && tooltip && (
                <div
                    className="absolute pointer-events-none transition-all duration-75 ease-out glass-container-card p-3 rounded-2xl bg-white/95 z-20 shadow-xl border-[#6605c7]/10"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y - 12}px`,
                        transform: "translate(-50%, -100%) translateZ(30px)",
                        transformStyle: "preserve-3d",
                        perspective: "1000px",
                        minWidth: "160px"
                    }}
                >
                    <div className="flex justify-between items-center text-[8.5px] font-black uppercase text-gray-400 tracking-wider">
                        <span>Phase 0{tooltip.phase}</span>
                        <span className="font-mono text-[#6605c7]">{tooltip.pct}%</span>
                    </div>
                    <h4 className="text-[11.5px] font-black text-gray-800 uppercase tracking-tight mt-1">
                        {tooltip.stage}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-900 mt-2.5 pt-1.5 border-t border-gray-100">
                        <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Caseload</span>
                        <span>{tooltip.count} files</span>
                    </div>
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-150" />
                </div>
            )}
        </div>
    );
}
