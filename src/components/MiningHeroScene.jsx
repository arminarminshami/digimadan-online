import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './MiningHeroScene.css'

// رنگ‌های صحنه دقیقاً از همان پالت برند دیجی‌معدن گرفته شده‌اند
const COLORS = {
  charcoal: 0x1c1b19,
  charcoalLight: 0x2c2a26,
  copper: 0xc2703d,
  copperDark: 0xa35a2c,
  sage: 0x5c7a52,
  limestone: 0xf6f3ec,
  dust: 0xd9b27c,
}

function buildMountain() {
  const group = new THREE.Group()
  // چند مخروط هم‌مرکز با ارتفاع/چرخش متفاوت تا شبیه رشته‌کوه شود، نه یک مخروط ساده
  const layerColors = [COLORS.charcoal, COLORS.charcoalLight, COLORS.copperDark]
  const positions = [
    [-2.6, 0, -1, 1.6, 2.4],
    [0, 0, 0, 2.2, 3.4],
    [2.4, 0, -0.6, 1.4, 2.1],
  ]
  positions.forEach(([x, y, z, radius, height], i) => {
    const geo = new THREE.ConeGeometry(radius, height, 6)
    const mat = new THREE.MeshStandardMaterial({
      color: layerColors[i % layerColors.length],
      flatShading: true,
      roughness: 0.9,
    })
    const cone = new THREE.Mesh(geo, mat)
    cone.position.set(x, height / 2 - 1.1, z)
    cone.rotation.y = i * 0.4
    group.add(cone)
  })
  return group
}

function buildExcavator() {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.copper, flatShading: true, roughness: 0.6 })
  const darkMat = new THREE.MeshStandardMaterial({ color: COLORS.charcoal, flatShading: true, roughness: 0.7 })

  // بدنه + شاسی
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 1.2), darkMat)
  base.position.set(0, -0.55, 0)
  group.add(base)

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.7, 1), bodyMat)
  cab.position.set(-0.15, -0.05, 0)
  group.add(cab)

  // بازوی هیدرولیکی (سه قطعه، هرکدام pivot جدا برای چرخش طبیعی)
  const armPivot = new THREE.Group()
  armPivot.position.set(0.35, 0.25, 0)
  group.add(armPivot)

  const upperArm = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.22, 0.22), darkMat)
  upperArm.position.set(0.6, 0.1, 0)
  upperArm.rotation.z = -0.5
  armPivot.add(upperArm)

  const forearmPivot = new THREE.Group()
  forearmPivot.position.set(1.15, 0.55, 0)
  armPivot.add(forearmPivot)

  const forearm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.18), bodyMat)
  forearm.position.set(0.45, -0.15, 0)
  forearm.rotation.z = 0.9
  forearmPivot.add(forearm)

  const bucketPivot = new THREE.Group()
  bucketPivot.position.set(0.85, -0.55, 0)
  forearmPivot.add(bucketPivot)

  const bucket = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.32, 0.5), darkMat)
  bucket.position.set(0.15, -0.1, 0)
  bucketPivot.add(bucket)

  return { group, armPivot, forearmPivot, bucketPivot }
}

function buildTruck() {
  const group = new THREE.Group()
  const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS.charcoalLight, flatShading: true, roughness: 0.7 })
  const bedMat = new THREE.MeshStandardMaterial({ color: COLORS.copperDark, flatShading: true, roughness: 0.6 })

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.9), bodyMat)
  cabin.position.set(-1, -0.55, 0)
  group.add(cabin)

  const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.0), bedMat)
  bed.position.set(0.3, -0.6, 0)
  group.add(bed)

  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10)
  const wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.charcoal, flatShading: true })
  ;[[-1.3, -0.9, 0.45], [-1.3, -0.9, -0.45], [0.7, -0.9, 0.45], [0.7, -0.9, -0.45]].forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(x, y, z)
    group.add(wheel)
  })

  return group
}

function buildDustParticles() {
  const count = 50
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6
    positions[i * 3 + 1] = Math.random() * 1.8 - 0.6
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color: COLORS.dust, size: 0.045, transparent: true, opacity: 0.55 })
  return new THREE.Points(geo, mat)
}

export default function MiningHeroScene() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isNarrowViewport = window.innerWidth < 760

    // در موبایل یا حالت کاهش حرکت، صحنه‌ی سه‌بعدی سبک‌تر (یک فریم ثابت) رندر می‌شود
    const animationEnabled = !prefersReducedMotion && !isNarrowViewport

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.6, 6.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isNarrowViewport ? 1 : 1.6))
    container.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(COLORS.limestone, 0.55))
    const sun = new THREE.DirectionalLight(0xffd9a8, 1.1)
    sun.position.set(4, 5, 3)
    scene.add(sun)
    const rim = new THREE.DirectionalLight(COLORS.copper, 0.4)
    rim.position.set(-4, 2, -3)
    scene.add(rim)

    const mountain = buildMountain()
    mountain.position.set(0.4, -0.2, -2.5)
    scene.add(mountain)

    const { group: excavator, armPivot, forearmPivot, bucketPivot } = buildExcavator()
    excavator.position.set(-1.1, 0, 0.3)
    excavator.scale.setScalar(1.05)
    scene.add(excavator)

    const truck = buildTruck()
    truck.position.set(1.9, 0, -0.2)
    truck.rotation.y = 0.35
    scene.add(truck)

    const dust = buildDustParticles()
    scene.add(dust)

    function resize() {
      const { width, height } = container.getBoundingClientRect()
      if (width === 0 || height === 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    resize()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    // پیشرفت اسکرول داخل بخش هرو، بین ۰ تا ۱
    function getScrollProgress() {
      const heroEl = container.closest('.hero')
      if (!heroEl) return 0
      const rect = heroEl.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const passed = window.innerHeight - rect.top
      return Math.min(1, Math.max(0, passed / total))
    }

    let rafId
    let isVisible = true
    let renderedStaticFrame = false

    function renderFrame() {
      const progress = animationEnabled ? getScrollProgress() : 0.35

      // بازوی بیل مکانیکی طبق پیشرفت اسکرول حرکت می‌کند: فرو رفتن در خاک، بلند شدن، تخلیه روی کامیون
      const dig = Math.sin(progress * Math.PI) // ۰ -> ۱ -> ۰
      armPivot.rotation.z = -0.15 - dig * 0.35
      forearmPivot.rotation.z = 0.3 + dig * 0.5
      bucketPivot.rotation.z = -0.4 + Math.max(0, progress - 0.6) * 1.8

      dust.material.opacity = 0.25 + dig * 0.4
      dust.rotation.y += animationEnabled ? 0.0008 : 0

      renderer.render(scene, camera)
    }

    function loop() {
      if (!isVisible) {
        rafId = null
        return
      }
      renderFrame()
      if (animationEnabled) rafId = requestAnimationFrame(loop)
    }

    if (animationEnabled) {
      rafId = requestAnimationFrame(loop)
    } else if (!renderedStaticFrame) {
      renderFrame()
      renderedStaticFrame = true
    }

    // برای صرفه‌جویی در باتری/CPU، وقتی صحنه از دید کاربر خارج شود رندر متوقف می‌شود
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      if (isVisible && animationEnabled && !rafId) {
        rafId = requestAnimationFrame(loop)
      }
    })
    intersectionObserver.observe(container)

    function handleVisibilityChange() {
      isVisible = document.visibilityState === 'visible' && isVisible
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      container.removeChild(renderer.domElement)
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
      })
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="mining-hero-scene" aria-hidden="true" />
}
