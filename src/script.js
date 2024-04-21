import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import GUI from "lil-gui"
import gsap from "gsap"
import fireworkVertexShader from "./shaders/firework/vertex.glsl"
import fireworkFragmentShader from "./shaders/firework/fragment.glsl"
import { Sky } from "three/addons/objects/Sky.js"

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })

const config = {}

// Canvas
const canvas = document.querySelector("canvas.webgl")

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
}

sizes.resolution = new THREE.Vector2(
  sizes.width * sizes.pixelRatio,
  sizes.height * sizes.pixelRatio
)

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight
  sizes.resolution.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  )

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(sizes.pixelRatio)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  25,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.set(1.5, 0, 6)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

const textures = [
  textureLoader.load("./particles/1.png"),
  textureLoader.load("./particles/2.png"),
  textureLoader.load("./particles/3.png"),
  textureLoader.load("./particles/4.png"),
  textureLoader.load("./particles/5.png"),
  textureLoader.load("./particles/6.png"),
  textureLoader.load("./particles/7.png"),
  textureLoader.load("./particles/8.png"),
]

//FIREWORKS
// we wnat to create this when we click
const createFirework = (count, position, size, texture, radius, color) => {
  // create a float 32 array with 3 values
  const positions = new Float32Array(count * 3)
  const sizesArray = new Float32Array(count)
  const timeRandomizer = new Float32Array(count)

  // create a float 32 array with 3 values
  for (let i = 0; i < count; i++) {
    const pIndex = i * 3

    // position each point around a sphere
    const spherical = new THREE.Spherical(
      // randomize the radius so we choose points form inner to outer
      radius * (0.75 + Math.random() * 0.25),
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2
    )

    const spherePosition = new THREE.Vector3(position.x, position.y, position.z)
    spherePosition.setFromSpherical(spherical)

    positions[pIndex] = spherePosition.x
    positions[pIndex + 1] = spherePosition.y
    positions[pIndex + 2] = spherePosition.z

    sizesArray[i] = Math.random()
    timeRandomizer[i] = 1 + Math.random()
  }

  // create a geometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.setAttribute(
    "aSize",
    new THREE.Float32BufferAttribute(sizesArray, 1)
  )

  geometry.setAttribute(
    "aTimeRandomizer",
    new THREE.Float32BufferAttribute(timeRandomizer, 1)
  )

  // create a material

  // Material
  texture.flipY = false
  const material = new THREE.ShaderMaterial({
    vertexShader: fireworkVertexShader,
    fragmentShader: fireworkFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSize: new THREE.Uniform(size),
      uResolution: new THREE.Uniform(sizes.resolution),
      uTexture: new THREE.Uniform(texture),
      uColor: new THREE.Uniform(color),
      uProgress: { value: 0 },
    },
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    transparent: true,
  })

  // create a points
  const firework = new THREE.Points(geometry, material)
  firework.position.copy(position)
  scene.add(firework)

  // Destroy
  const destroy = () => {
    scene.remove(firework)
    geometry.dispose()
    material.dispose()
  }

  // Animate
  gsap.to(material.uniforms.uProgress, {
    value: 1,
    ease: "linear",
    duration: 3,
    onComplete: destroy,
  })
}

const createRandomFirework = (e) => {
  const windowPosition = new THREE.Vector3(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
    0
  )

  const count = Math.round(400 + Math.random() * 1000)
  const position = windowPosition
  const size = 0.1 + Math.random() * 0.1
  const texture = textures[Math.floor(Math.random() * textures.length)]
  const radius = 0.5 + Math.random()
  const color = new THREE.Color().setHSL(Math.random(), 1, 0.7)

  createFirework(count, position, size, texture, radius, color)
}

// CLICK EVENTS
window.addEventListener("click", createRandomFirework)

/**
 * Sky
 */

const sky = new Sky()
sky.scale.setScalar(450000)
scene.add(sky)

const sun = new THREE.Vector3()

const skyParameters = {
  turbidity: 10,
  rayleigh: 3,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.95,
  elevation: -2.2,
  azimuth: 180,
  exposure: renderer.toneMappingExposure,
}

const updateSky = () => {
  const uniforms = sky.material.uniforms
  uniforms["turbidity"].value = skyParameters.turbidity
  uniforms["rayleigh"].value = skyParameters.rayleigh
  uniforms["mieCoefficient"].value = skyParameters.mieCoefficient
  uniforms["mieDirectionalG"].value = skyParameters.mieDirectionalG

  const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation)
  const theta = THREE.MathUtils.degToRad(skyParameters.azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  uniforms["sunPosition"].value.copy(sun)

  renderer.toneMappingExposure = skyParameters.exposure
  renderer.render(scene, camera)
}

gui.add(skyParameters, "turbidity", 0.0, 20.0, 0.1).onChange(updateSky)
gui.add(skyParameters, "rayleigh", 0.0, 4, 0.001).onChange(updateSky)
gui.add(skyParameters, "mieCoefficient", 0.0, 0.1, 0.001).onChange(updateSky)
gui.add(skyParameters, "mieDirectionalG", 0.0, 1, 0.001).onChange(updateSky)
gui.add(skyParameters, "elevation", -3, 10, 0.01).onChange(updateSky)
gui.add(skyParameters, "azimuth", -180, 180, 0.1).onChange(updateSky)
gui.add(skyParameters, "exposure", 0, 1, 0.0001).onChange(updateSky)

updateSky()

/**
 * Animate
 */
const tick = () => {
  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
