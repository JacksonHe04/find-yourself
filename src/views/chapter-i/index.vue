<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// 场景初始化
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: PointerLockControls;

// 记忆碎片系统
interface MemoryFragment {
  mesh: THREE.Mesh;
  lyric: string;
  collected: boolean;
}

const fragments = ref<MemoryFragment[]>([]);
const collectedCount = ref(0);
const totalFragments = 5;
const showLyric = ref(false);
const currentLyric = ref('');
const showStartButton = ref(true); // 控制开始按钮的显示

// 移动控制变量
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  speed: 0.1
};

/**
 * @function initThree
 * @description 初始化Three.js场景
 */
const initThree = () => {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.001); // 降低雾效浓度

  // 创建星星背景
  createStars();
  
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('game-container')?.appendChild(renderer.domElement);

  // 添加环境光和点光源
  const ambientLight = new THREE.AmbientLight(0x404040);
  const pointLight = new THREE.PointLight(0xffffff, 1, 100);
  pointLight.position.set(0, 10, 0);
  scene.add(ambientLight, pointLight);

  // 创建地面
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // 设置相机位置
  camera.position.y = 2;

  // 初始化控制器
  controls = new PointerLockControls(camera, document.body);

  // 创建记忆碎片
  createMemoryFragments();
};

/**
 * @function createMemoryFragments
 * @description 创建记忆碎片
 */
const createMemoryFragments = () => {
  const lyrics = [
    "Seeing this makes it easy, easier to fall",
    "You're breathing softly, but so much stronger on your own",
    "I am not enough, I'm not the demons in your lungs",
    "I read your note, and I know just what you want to hear",
    "Time may heal the deepest wounds, but a severed limb is gone for good"
  ];

  for (let i = 0; i < totalFragments; i++) {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      Math.random() * 40 - 20,
      1.5,
      Math.random() * 40 - 20
    );

    const fragment: MemoryFragment = {
      mesh,
      lyric: lyrics[i],
      collected: false
    };

    fragments.value.push(fragment);
    scene.add(mesh);
  }
};

/**
 * @function checkFragmentCollection
 * @description 检查碎片收集
 */
const checkFragmentCollection = () => {
  if (!controls.isLocked) return;

  const playerPosition = camera.position;
  fragments.value.forEach(fragment => {
    if (!fragment.collected) {
      const distance = playerPosition.distanceTo(fragment.mesh.position);
      if (distance < 2) {
        fragment.collected = true;
        fragment.mesh.visible = false;
        collectedCount.value++;
        showCollectedLyric(fragment.lyric);
      }
    }
  });
};

/**
 * @function showCollectedLyric
 * @description 显示收集到的歌词
 * @param {string} lyric - 歌词内容
 */
const showCollectedLyric = (lyric: string) => {
  currentLyric.value = lyric;
  showLyric.value = true;
  setTimeout(() => {
    showLyric.value = false;
  }, 5000);
};

/**
 * @function animate
 * @description 动画循环
 */
const animate = () => {
  requestAnimationFrame(animate);
  handleMovement();
  checkFragmentCollection();
  updateStars();
  
  // 旋转记忆碎片
  fragments.value.forEach(fragment => {
    if (!fragment.collected) {
      fragment.mesh.rotation.y += 0.01;
      fragment.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  renderer.render(scene, camera);
};

// 星星变量
let stars: THREE.Points;

/**
 * @function createStars
 * @description 创建星星粒子系统
 */
const createStars = () => {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5, // 增大星星大小
    transparent: true,
    blending: THREE.AdditiveBlending,
    map: generateSprite()
  });

  const starVertices = [];
  for (let i = 0; i < 50000; i++) { // 增加星星数量
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
  stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
};

/**
 * @function generateSprite
 * @description 生成星星纹理
 * @returns {THREE.CanvasTexture} 星星纹理
 */
const generateSprite = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;

  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,1)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  return new THREE.CanvasTexture(canvas);
};

/**
 * @function updateStars
 * @description 更新星星动画
 */
const updateStars = () => {
  if (stars) {
    stars.rotation.y += 0.0005;
  }
};

/**
 * @function handleMovement
 * @description 处理移动
 */
const handleMovement = () => {
  if (!controls.isLocked) return;

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();

  if (moveState.forward) frontVector.z -= 1;
  if (moveState.backward) frontVector.z += 1;
  if (moveState.left) sideVector.x -= 1;
  if (moveState.right) sideVector.x += 1;

  direction
    .subVectors(frontVector, sideVector)
    .normalize()
    .multiplyScalar(moveState.speed);

  controls.moveRight(-direction.x); // 反转左右方向
  controls.moveForward(-direction.z);
};

/**
 * @function handleKeyDown
 * @description 键盘按下事件处理
 * @param {KeyboardEvent} event - 键盘事件
 */
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveState.forward = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveState.backward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveState.left = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveState.right = true;
      break;
  }
};

/**
 * @function handleKeyUp
 * @description 键盘释放事件处理
 * @param {KeyboardEvent} event - 键盘事件
 */
const handleKeyUp = (event: KeyboardEvent) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveState.forward = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveState.backward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveState.left = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveState.right = false;
      break;
  }
};

/**
 * @function startGame
 * @description 开始游戏，锁定指针并隐藏开始按钮
 */
const startGame = () => {
  showStartButton.value = false; // 立即隐藏按钮
  controls.lock();
};

// 组件挂载时初始化
onMounted(() => {
  initThree();
  animate();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  renderer.dispose();
});
</script>

<template>
  <div id="game-container">
    <div v-if="showStartButton" class="start-screen">
      <button @click="startGame" class="start-button">开始游戏</button>
    </div>
    <div v-if="showLyric" class="lyric-display">
      {{ currentLyric }}
    </div>
    <div class="fragment-counter">
      记忆碎片: {{ collectedCount }} / {{ totalFragments }}
    </div>
  </div>
</template>

<style scoped>
#game-container {
  width: 100vw;
  height: 100vh;
  position: relative;
}

.start-screen {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.start-button {
  padding: 15px 30px;
  font-size: 1.2em;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.start-button:hover {
  background-color: #45a049;
}

.lyric-display {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 20px;
  border-radius: 10px;
  font-size: 1.2em;
  text-align: center;
  animation: fadeIn 0.5s ease-in-out;
}

.fragment-counter {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1.1em;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>