"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive 3D lighting rig: a field of fixtures seen in perspective.
 * A wave of light rolls across it; the pointer pushes a ripple through the rig.
 */
export function LightField({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    let disposed = false;
    let cleanup = () => {};

    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting || disposed) return;
        io.disconnect();
        let THREE: typeof import("three");
        try {
          THREE = await import("three");
        } catch {
          return; // 3D is decorative: without it the section still reads fine
        }
        if (disposed) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
        el.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        camera.position.set(0, 3.4, 9.5);
        camera.lookAt(0, 0, -1);

        const COLS = 64;
        const ROWS = 36;
        const n = COLS * ROWS;
        const pos = new Float32Array(n * 3);
        const seed = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          pos[i * 3] = (c / (COLS - 1) - 0.5) * 16;
          pos[i * 3 + 1] = 0;
          pos[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * 12 - 1;
          seed[i] = Math.random();
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("seed", new THREE.BufferAttribute(seed, 1));

        const uniforms = {
          uTime: { value: 0 },
          uPointer: { value: new THREE.Vector2(99, 99) },
          uPulse: { value: 0 },
          uPixel: { value: renderer.getPixelRatio() },
          uWarm: { value: new THREE.Color("#ffc56e") },
          uGel: { value: new THREE.Color("#ff2e93") },
          uCool: { value: new THREE.Color("#5b4bff") },
        };
        const mat = new THREE.ShaderMaterial({
          uniforms,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          vertexShader: /* glsl */ `
            attribute float seed;
            uniform float uTime; uniform vec2 uPointer; uniform float uPulse; uniform float uPixel;
            varying float vI; varying float vMix; varying float vSeed;
            void main() {
              vec3 p = position;
              float wave = sin(p.x * 0.55 + uTime * 1.1) * cos(p.z * 0.45 - uTime * 0.7);
              float d = distance(p.xz, uPointer);
              float ripple = sin(d * 2.6 - uTime * 5.0) * exp(-d * 0.42) * (0.6 + uPulse);
              p.y += wave * 0.45 + ripple * 0.9;
              vI = clamp(0.25 + wave * 0.45 + ripple * 0.9 + step(0.985, fract(seed * 91.7 + uTime * 0.15)) * 1.2, 0.0, 2.0);
              vMix = 0.5 + 0.5 * sin(p.x * 0.25 + uTime * 0.3 + seed * 2.0);
              vSeed = seed;
              vec4 mv = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = (3.5 + vI * 8.0) * uPixel * (9.0 / -mv.z);
            }`,
          fragmentShader: /* glsl */ `
            uniform vec3 uWarm; uniform vec3 uGel; uniform vec3 uCool;
            varying float vI; varying float vMix; varying float vSeed;
            void main() {
              vec2 c = gl_PointCoord - 0.5;
              float r = length(c);
              float a = smoothstep(0.5, 0.0, r);
              a *= a;
              vec3 col = mix(uWarm, mix(uGel, uCool, vSeed), vMix * 0.75);
              gl_FragColor = vec4(col * (0.55 + vI * 1.3), a * (0.4 + vI * 0.6));
            }`,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();
        const ndc = new THREE.Vector2();
        const target = new THREE.Vector2(99, 99);
        const onMove = (e: PointerEvent) => {
          const b = el.getBoundingClientRect();
          ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
          raycaster.setFromCamera(ndc, camera);
          if (raycaster.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z);
        };
        const onDown = () => (uniforms.uPulse.value = 1.4);
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerdown", onDown);

        const resize = () => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.fov = w < 640 ? 58 : 42;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();

        let visible = true;
        const vis = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
        vis.observe(el);

        let raf = 0;
        let last = performance.now();
        const frame = () => {
          raf = requestAnimationFrame(frame);
          if (!visible) return;
          const t = performance.now();
          const dt = Math.min((t - last) / 1000, 0.05);
          last = t;
          uniforms.uTime.value += reduce ? dt * 0.15 : dt;
          uniforms.uPulse.value *= 0.95;
          (uniforms.uPointer.value as InstanceType<typeof THREE.Vector2>).lerp(target, 0.08);
          points.rotation.y = Math.sin(uniforms.uTime.value * 0.07) * 0.12;
          renderer.render(scene, camera);
        };
        frame();

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          vis.disconnect();
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerdown", onDown);
          geo.dispose();
          mat.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => {
      disposed = true;
      io.disconnect();
      cleanup();
    };
  }, []);

  return <div ref={host} className={className} />;
}
