<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

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

// 移动控制变量
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  speed: 0.1
};

// 初始化Three.js场景
const initThree = () => {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
  
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

// 创建记忆碎片
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

// 检查碎片收集
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

// 显示收集到的歌词
const showCollectedLyric = (lyric: string) => {
  currentLyric.value = lyric;
  showLyric.value = true;
  setTimeout(() => {
    showLyric.value = false;
  }, 5000);
};

// 动画循环
const animate = () => {
  requestAnimationFrame(animate);
  handleMovement();
  checkFragmentCollection();
  
  // 旋转记忆碎片
  fragments.value.forEach(fragment => {
    if (!fragment.collected) {
      fragment.mesh.rotation.y += 0.01;
      fragment.mesh.position.y = 1.5 + Math.sin(Date.now() * 0.002) * 0.1;
    }
  });

  renderer.render(scene, camera);
};

// 处理移动
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

  controls.moveRight(direction.x);
  controls.moveForward(-direction.z);
};

// 键盘事件处理
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

// 点击开始游戏
const startGame = () => {
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
    <div v-if="!controls?.isLocked" class="start-screen">
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
