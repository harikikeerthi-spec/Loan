"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface WebGLComplianceShieldProps {
    isWarning: boolean;
}

export default function WebGLComplianceShield({ isWarning }: WebGLComplianceShieldProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Keep warning state ref updated
    const isWarningRef = useRef(isWarning);
    useEffect(() => {
        isWarningRef.current = isWarning;
    }, [isWarning]);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const canvas = canvasRef.current;

        // --- Three.js Setup ---
        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(
            45,
            container.clientWidth / container.clientHeight,
            0.1,
            50
        );
        camera.position.z = 5.2;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // --- Holographic Geometry ---
        // Icosahedron creates a beautiful futuristic faceted wireframe sphere
        const outerGeo = new THREE.IcosahedronGeometry(1.4, 2);
        const outerMat = new THREE.MeshBasicMaterial({
            color: 0x6605c7,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
        });
        const outerMesh = new THREE.Mesh(outerGeo, outerMat);
        scene.add(outerMesh);

        // Inner solid core sphere with subtle glow mapping
        const innerGeo = new THREE.IcosahedronGeometry(1.1, 1);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x8b24e5,
            transparent: true,
            opacity: 0.15,
            wireframe: false,
        });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        scene.add(innerMesh);

        // Add small point light in the center for depth reflections
        const centerLight = new THREE.PointLight(0xa855f7, 2, 5);
        scene.add(centerLight);

        // --- Animation Loop ---
        let animationFrameId: number;
        const clock = new THREE.Clock();

        let currentRotationSpeed = 0.012;

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();
            const warningActive = isWarningRef.current;

            if (warningActive) {
                // Warning State: Lock rotation & pulse red glow
                currentRotationSpeed += (0.0 - currentRotationSpeed) * 0.12; // slow to a stop
                
                // Color transition to crimson red
                outerMat.color.setHex(0xef4444);
                innerMat.color.setHex(0xef4444);
                centerLight.color.setHex(0xef4444);

                // Low-frequency warning pulse opacity
                const pulse = 0.35 + Math.sin(elapsedTime * 6.5) * 0.25;
                outerMat.opacity = pulse;
                innerMat.opacity = pulse * 0.25;
                
                // Lock geometric scale to a slightly distorted warnings state
                const scalePulse = 1.0 + Math.sin(elapsedTime * 6.5) * 0.03;
                outerMesh.scale.set(scalePulse, scalePulse, scalePulse);
                innerMesh.scale.set(scalePulse, scalePulse, scalePulse);
            } else {
                // Compliant State: Spin smoothly and float
                currentRotationSpeed += (0.012 - currentRotationSpeed) * 0.08;
                
                // Normal theme colors
                outerMat.color.setHex(0x6605c7);
                innerMat.color.setHex(0x8b24e5);
                centerLight.color.setHex(0xa855f7);

                // Normal floating opacity
                outerMat.opacity = 0.75 + Math.sin(elapsedTime * 1.5) * 0.1;
                innerMat.opacity = 0.12;

                // Reset standard scale
                outerMesh.scale.set(1, 1, 1);
                innerMesh.scale.set(1, 1, 1);

                // Continuous rotation
                outerMesh.rotation.y += currentRotationSpeed;
                outerMesh.rotation.x += currentRotationSpeed * 0.35;
                innerMesh.rotation.y -= currentRotationSpeed * 0.5;
            }

            // Normal vertical floating motion
            const floatOffset = Math.sin(elapsedTime * 1.6) * 0.08;
            outerMesh.position.y = floatOffset;
            innerMesh.position.y = floatOffset;

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
            resizeObserver.disconnect();
            
            scene.traverse((object) => {
                if (!(object instanceof THREE.Mesh)) return;
                
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach((mat) => mat.dispose());
                } else {
                    object.material.dispose();
                }
            });
            renderer.dispose();
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[140px] flex items-center justify-center relative select-none">
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
}
