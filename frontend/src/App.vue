<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from './components/Header/Header.vue';
import { toggleMiniDashboard } from './components/MiniDashboard/MiniDashboard.vue';

const router = useRouter();
const route = useRoute();
const showModal = ref(false);
const isMiniDashboardOpen = ref(false);

const testData = ref({
  speed: null,
  ping: null,
  statusLabel: 'Sin datos',
  statusClass: ''
});

const onLoginSuccess = () => {
  isRegistered.value = true;
  tabActual.value = 'test';
};

const confirmLogout = () => {
  localStorage.clear();
  showModal.value = false;
  router.push('/login');
};

const handleTestComplete = (data) => {
  testData.value = data;
  if (isMiniDashboardOpen.value) {
    toggleMiniDashboard(data);
  }
};

const openMiniDashboard = () => {
  isMiniDashboardOpen.value = true;
  toggleMiniDashboard(); // Abre la ventana usando los últimos datos guardados
};
</script>

<template>
  <Header 
    v-if="route && route.path && route.path !== '/login'"
    :speed="testData.speed"
    :ping="testData.ping"
    :status="{ label: testData.statusLabel, class: testData.statusClass }"
    @openMiniDashboard="openMiniDashboard"
    @triggerLogout="showModal = true"
  />
    
  <div v-if="route.path === '/mapa' || route.path === '/config'" class="container dashboard-mode">
    <div class="dashboard-view">
      <router-view @test-complete="handleTestComplete" />
    </div>
  </div>

  <template v-else>
    <router-view @test-complete="handleTestComplete" />
  </template>

  <Teleport to="body">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h2>¿Cerrar Sesión?</h2>
        <p>Se borrarán los datos de esta sesión y volverás al registro.</p>
        <div class="modal-buttons">
          <button @click="confirmLogout" class="btn-confirm">Sí, salir</button>
          <button @click="showModal = false" class="btn-cancel">Regresar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>