"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface DataPoint {
    month: string;
    amount: number;
}

interface WebGLDisbursementPulseProps {
    data: DataPoint[];
}

export default function WebGLDisbursementPulse({ data }: WebGLDisbursementPulseProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; month: string; value: number } | null>(null);

    const dataRef = useRef(data);
    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;

        // --- Three.js Scene Setup ---
        const scene = new THREE.Scene();
        scene.background = null;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            100
        );
        camera.position.set(0, 2.2, 8.5);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // --- Lights ---
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        scene.add(ambientLight);

        // Fixed soft directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight.position.set(5, 8, 5);
        scene.add(dirLight);

        // Specular Office Light: This light shifts dynamically with the mouse cursor
        // to animate specular highlights across the physical glass ribbon wavefront.
        const specLight = new THREE.PointLight(0x8b24e5, 3.5, 15);
        specLight.position.set(0, 3, 3);
        scene.add(specLight);

        // Node hover spotlight
        const spotLight = new THREE.SpotLight(0xa855f7, 2.5, 12, Math.PI / 6, 0.4, 1);
        spotLight.position.set(0, 4, 2);
        scene.add(spotLight);

        // --- Tilted Grid Plane ---
        const gridGroup = new THREE.Group();
        gridGroup.rotation.x = -Math.PI / 12; // tilted grid plane
        scene.add(gridGroup);

        const gridHelper = new THREE.GridHelper(12, 12, 0x6605c7, 0xe2e8f0);
        if (Array.isArray(gridHelper.material)) {
            gridHelper.material.forEach((mat) => {
                mat.transparent = true;
                mat.opacity = 0.2;
            });
        } else {
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.2;
        }
        gridHelper.position.y = -1.2;
        gridGroup.add(gridHelper);

        // Shadow Plane
        const shadowPlaneGeo = new THREE.PlaneGeometry(16, 16);
        const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.05 });
        const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
        shadowPlane.rotation.x = -Math.PI / 2;
        shadowPlane.position.y = -1.21;
        shadowPlane.receiveShadow = true;
        gridGroup.add(shadowPlane);

        // --- Capital Flow Wavefront Terrain Curtain ---
        const pointsData = dataRef.current.length > 0 ? dataRef.current : [
            { month: 'Jan', amount: 0.45 },
            { month: 'Feb', amount: 0.52 },
            { month: 'Mar', amount: 0.60 },
            { month: 'Apr', amount: 0.48 },
            { month: 'May', amount: 0.75 },
            { month: 'Jun', amount: 0.90 }
        ];

        const xRange = 8.0;
        const xStep = xRange / (pointsData.length - 1);
        const startX = -xRange / 2;

        const curvePoints: THREE.Vector3[] = [];
        const nodePositions: { x: number; y: number; z: number; month: string; amount: number }[] = [];

        pointsData.forEach((pt, index) => {
            const x = startX + index * xStep;
            const y = -0.5 + (pt.amount * 1.8);
            const z = -0.3 + Math.sin(index * 1.0) * 0.4;
            curvePoints.push(new THREE.Vector3(x, y, z));
            nodePositions.push({ x, y, z, month: pt.month, amount: pt.amount });
        });

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        
        // Render 3D Ribbon Tube (Edge path)
        const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.07, 12, false);
        const tubeMat = new THREE.MeshStandardMaterial({
            color: 0x6605c7,
            roughness: 0.05,
            metalness: 0.85,
            emissive: 0x6605c7,
            emissiveIntensity: 1.2
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        tubeMesh.castShadow = true;
        gridGroup.add(tubeMesh);

        // Generating Wavefront Terrain Curtain (Extrusion from grid floor up to curve points)
        const curtainSegments = 80;
        const curtainPoints = curve.getPoints(curtainSegments);
        const curtainGeo = new THREE.BufferGeometry();
        
        const vertices: number[] = [];
        const indices: number[] = [];
        const uvs: number[] = [];

        // Build vertical strip vertices
        curtainPoints.forEach((pt, idx) => {
            // Top point (on curve)
            vertices.push(pt.x, pt.y, pt.z);
            // Bottom point (on grid floor -1.2)
            vertices.push(pt.x, -1.2, pt.z);

            // UVs
            const u = idx / curtainSegments;
            uvs.push(u, 1); // top
            uvs.push(u, 0); // bottom
        });

        // Build face indices (quads connecting segments)
        for (let i = 0; i < curtainSegments; i++) {
            const topL = i * 2;
            const botL = i * 2 + 1;
            const topR = (i + 1) * 2;
            const botR = (i + 1) * 2 + 1;

            // Triangle 1
            indices.push(topL, botL, topR);
            // Triangle 2
            indices.push(topR, botL, botR);
        }

        curtainGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        curtainGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        curtainGeo.setIndex(indices);
        curtainGeo.computeVertexNormals();

        // Premium Translucent Glass Curtain Material
        const curtainMat = new THREE.MeshPhysicalMaterial({
            color: 0x6605c7,
            roughness: 0.05,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
            transmission: 0.55,
            thickness: 0.6,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
        gridGroup.add(curtainMesh);

        // --- Interactive Spheres & Hover Rays ---
        const sphereGeo = new THREE.SphereGeometry(0.16, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.05,
            metalness: 0.9,
            emissive: 0x8b24e5,
            emissiveIntensity: 1.2
        });

        const spheres: THREE.Mesh[] = [];
        nodePositions.forEach((pos) => {
            const sphere = new THREE.Mesh(sphereGeo, sphereMat.clone());
            sphere.position.set(pos.x, pos.y, pos.z);
            sphere.castShadow = true;
            gridGroup.add(sphere);
            spheres.push(sphere);
        });

        // Vertical light ray cylinder
        const rayGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 16, 1, true);
        const rayMat = new THREE.MeshBasicMaterial({
            color: 0xc084fc,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const rayMesh = new THREE.Mesh(rayGeo, rayMat);
        gridGroup.add(rayMesh);

        // --- Specular mouse interactive coordinates mapping ---
        let targetLightX = 0;
        let targetLightY = 3.0;

        const onGlobalMouseMove = (event: MouseEvent) => {
            // Map mouse coordinates relative to window bounds
            const x = (event.clientX / window.innerWidth) * 6 - 3;
            const y = -(event.clientY / window.innerHeight) * 4 + 2;

            targetLightX = x;
            targetLightY = 1.5 + y;
        };

        window.addEventListener("mousemove", onGlobalMouseMove);

        // --- Local hover Raycasting ---
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        let currentHoverIdx: number | null = null;
        let targetRayHeight = 0;
        let targetRayY = 0;
        let targetRayX = 0;
        let targetRayZ = 0;
        let currentRayOpacity = 0;
        let currentRayHeight = 0.01;

        const onMouseMove = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            let closestIdx = -1;
            let minDistance = 0.6; // interaction radius

            spheres.forEach((sphere, idx) => {
                const tempV = new THREE.Vector3();
                sphere.getWorldPosition(tempV);
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
                    const pos = nodePositions[closestIdx];
                    targetRayX = pos.x;
                    targetRayZ = pos.z;
                    const height = pos.y - (-1.2);
                    targetRayHeight = height;
                    targetRayY = -1.2 + height / 2;

                    // Update spotlight
                    spotLight.position.set(pos.x, 3.5, pos.z + 1);
                    spotLight.target = spheres[closestIdx];
                    spotLight.intensity = 3.5;

                    // Tooltip placement coords
                    const tooltipPos = new THREE.Vector3();
                    spheres[closestIdx].getWorldPosition(tooltipPos);
                    tooltipPos.project(camera);

                    const x = (tooltipPos.x * .5 + .5) * rect.width;
                    const y = (-(tooltipPos.y * .5) + .5) * rect.height;

                    setTooltip({
                        x,
                        y,
                        month: pos.month,
                        value: pos.amount
                    });
                } else {
                    targetRayHeight = 0;
                    spotLight.intensity = 0.5;
                    setTooltip(null);
                }
            } else if (closestIdx !== -1 && tooltip) {
                const tooltipPos = new THREE.Vector3();
                spheres[closestIdx].getWorldPosition(tooltipPos);
                tooltipPos.project(camera);
                const x = (tooltipPos.x * .5 + .5) * rect.width;
                const y = (-(tooltipPos.y * .5) + .5) * rect.height;
                setTooltip(prev => prev ? { ...prev, x, y } : null);
            }
        };

        const onMouseLeave = () => {
            currentHoverIdx = null;
            setHoveredIndex(null);
            targetRayHeight = 0;
            spotLight.intensity = 0.5;
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

            // 1. Lerping Specular light position from global mouse movements
            specLight.position.x += (targetLightX - specLight.position.x) * 0.08;
            specLight.position.y += (targetLightY - specLight.position.y) * 0.08;

            // 2. Hover ray interpolations
            if (currentHoverIdx !== null) {
                currentRayOpacity += (0.85 - currentRayOpacity) * 0.15;
                currentRayHeight += (targetRayHeight - currentRayHeight) * 0.15;
            } else {
                currentRayOpacity += (0.0 - currentRayOpacity) * 0.15;
                currentRayHeight += (0.01 - currentRayHeight) * 0.15;
            }

            if (currentRayOpacity > 0.01) {
                rayMesh.visible = true;
                rayMesh.position.set(targetRayX, targetRayY, targetRayZ);
                rayMesh.scale.set(1, currentRayHeight, 1);
                if (rayMesh.material instanceof THREE.MeshBasicMaterial) {
                    rayMesh.material.opacity = currentRayOpacity * (0.85 + Math.sin(elapsedTime * 9) * 0.15);
                }
            } else {
                rayMesh.visible = false;
            }

            // 3. Animate node spheres scale & float wave
            spheres.forEach((sphere, idx) => {
                const isHovered = idx === currentHoverIdx;
                const targetScale = isHovered ? 1.6 : 1.0;
                sphere.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

                const mat = sphere.material as THREE.MeshStandardMaterial;
                const targetEmissive = isHovered ? 3.5 : 1.2;
                mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;

                sphere.position.y = nodePositions[idx].y + Math.sin(elapsedTime * 2.0 + idx) * 0.035;
            });

            // 4. Parallax sway of graph grid
            gridGroup.rotation.y = Math.sin(elapsedTime * 0.3) * 0.015;

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
            window.removeEventListener("mousemove", onGlobalMouseMove);
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
    }, []);

    return (
        <div ref={containerRef} className="relative w-full h-full min-h-[220px]">
            <canvas ref={canvasRef} className="w-full h-full block" />
            {hoveredIndex !== null && tooltip && (
                <div
                    className="absolute pointer-events-none transition-all duration-75 ease-out glass-container-card p-3 rounded-2xl bg-white/95 z-20 shadow-xl"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y - 15}px`,
                        transform: "translate(-50%, -100%) translateZ(30px)",
                        transformStyle: "preserve-3d",
                        perspective: "1000px"
                    }}
                >
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400">
                        {tooltip.month}
                    </div>
                    <div className="text-[13px] font-black text-[#6605c7] mt-0.5 font-mono">
                        ₹ {tooltip.value.toFixed(2)} Cr
                    </div>
                    <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-r border-b border-gray-150" />
                </div>
            )}
        </div>
    );
}
