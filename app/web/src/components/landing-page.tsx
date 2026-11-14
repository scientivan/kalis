"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import "./landing.css";
import { LandingSections } from "./landing-sections";
const app = "https://app.kalis.scientivan.dev";
export function LandingPage() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 64);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    if (!ready || !host.current) return;
    // Vendored Three.js r160, MIT. All scene assets are constructed locally.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const T = (window as any).THREE;
    if (!T) return;
    const el = host.current;
    let renderer: any;
    try {
      renderer = new T.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const scene = new T.Scene(),
      camera = new T.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 4, 12);
    camera.lookAt(0, 0, 0);
    scene.add(new T.HemisphereLight(0xffffff, 0x47674d, 3));
    const light = new T.DirectionalLight(0xffffff, 4);
    light.position.set(3, 8, 5);
    scene.add(light);
    const world = new T.Group();
    scene.add(world);
    const material = (color: number) =>
      new T.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.15 });
    const blue = material(0x2463eb),
      white = material(0xf6fbff),
      green = material(0x81aa70);
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      mat: any,
      parent: any = world,
    ) => {
      const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    // A single meeting sculpture, with two distinct private volumes held together.
    const sculpture = new T.Group();
    world.add(sculpture);
    const glass = new T.MeshPhysicalMaterial({
      color: 0xdceaff,
      transparent: true,
      opacity: 0.23,
      roughness: 0.12,
      metalness: 0.1,
      side: T.DoubleSide,
      depthWrite: false,
    });
    const enclosure = new T.Mesh(new T.SphereGeometry(2.05, 64, 48), glass);
    sculpture.add(enclosure);
    const core = new T.Group();
    sculpture.add(core);
    const left = box(-0.56, 0, 0, 0.95, 1.6, 1.05, blue, core);
    const right = box(0.56, 0, 0, 0.95, 1.6, 1.05, white, core);
    left.rotation.z = 0.12;
    right.rotation.z = -0.12;
    for (let i = 0; i < 4; i++)
      box(-0.56, -0.48 + i * 0.32, 0.54, 0.55, 0.045, 0.025, white, core);
    for (let i = 0; i < 3; i++)
      box(0.56, -0.32 + i * 0.32, 0.54, 0.48, 0.08, 0.025, blue, core);
    const ringMaterial = material(0xabc8ef);
    const rings = [0, 1].map((i) => {
      const ring = new T.Mesh(
        new T.TorusGeometry(2.3 + i * 0.22, 0.025, 12, 100),
        ringMaterial,
      );
      ring.rotation.set(1.1 + i * 0.6, 0.3 + i * 0.8, 0.2);
      sculpture.add(ring);
      return ring;
    });
    const base = new T.Mesh(new T.CylinderGeometry(2.3, 2.5, 0.22, 80), white);
    base.position.y = -2.2;
    world.add(base);
    let pointer = 0,
      frame = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const move = (e: PointerEvent) => {
      pointer =
        (e.clientX - el.getBoundingClientRect().left) / el.clientWidth - 0.5;
    };
    el.addEventListener("pointermove", move);
    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const draw = (t: number) => {
      world.rotation.y +=
        ((reduced.matches ? 0 : pointer * 0.25) - world.rotation.y) * 0.035;
      if (!reduced.matches) {
        sculpture.position.y = Math.sin(t * 0.0008) * 0.09;
        core.rotation.y = Math.sin(t * 0.0003) * 0.18;
        rings[0].rotation.z = t * 0.00008;
        rings[1].rotation.z = -t * 0.00006;
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener("pointermove", move);
      scene.traverse((o: any) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [ready]);
  return (
    <main className="kl">
      <Script src="/landing/three.min.js" onReady={() => setReady(true)} />
      <header className={`kl-nav${scrolled ? " is-scrolled" : ""}`}>
        <a href="/landing" className="kl-brand">
          <img
            src="/landing/kalis-logo.svg"
            alt="Kalis"
            width="113"
            height="40"
          />
        </a>
        <button
          className="kl-menu-toggle"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="kl-site-nav"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d={menuOpen ? "M6 6l12 12M6 18L18 6" : "M4 8h16M4 16h16"} />
          </svg>
        </button>
        <nav
          id="kl-site-nav"
          className={menuOpen ? "is-open" : ""}
          aria-label="Landing navigation"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#how">How it works</a>
          <a href="#methods">Methods</a>
          <a href="#together">Build together</a>
        </nav>
        <a className="kl-button" href={app}>
          Open app <span aria-hidden="true">↗</span>
        </a>
      </header>
      <section className="kl-hero">
        <img
          className="kl-landscape"
          src="/landing/landscape.webp"
          alt="A green mountain landscape beneath an open blue sky"
        />
        <div
          className="kl-scene"
          ref={host}
          role="img"
          aria-label="One three-dimensional sculpture with separate blue and white private volumes meeting inside a transparent sphere"
        />
        <div className="kl-intro">
          <h1>
            Where expertise is traded,
            <br />
            run privately, and
            <br />
            improved together.
          </h1>
          <p>
            Run an expert’s method on your private data.
            <br />
            Stay in control. Help fund what comes next.
          </p>
          <div className="kl-hero-actions">
            <a className="kl-button" href={app + "/marketplace"}>
              Find your method <span aria-hidden="true">↗</span>
            </a>
            <a className="kl-secondary" href="#how">
              See how it works
            </a>
          </div>
        </div>
      </section>
      <LandingSections />
    </main>
  );
}
