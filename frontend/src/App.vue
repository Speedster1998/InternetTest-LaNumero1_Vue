<script setup>
import { ref } from 'vue';
import Login from './pages/Login/Login.vue';
import Header from './components/Header/Header.vue';
import InternetTest from './pages/InternetTest/InternetTest.vue';
import HeatMap from './pages/HeatMap/HeatMap.vue';
import Settings from './pages/Settings/Settings.vue';
import { toggleMiniDashboard } from './components/MiniDashboard/MiniDashboard.vue';

const isRegistered = ref(!!localStorage.getItem('userName'));
const tabActual = ref('test');
const showModal = ref(false);

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
  isRegistered.value = false;
  showModal.value = false;
};

const handleTestComplete = (data) => {
  testData.value = data;
  toggleMiniDashboard(data); // Mantiene la ventana actualizada al vuelo con los nuevos Mbps
};

const openMiniDashboard = () => {
  toggleMiniDashboard(); // Abre la ventana usando los últimos datos guardados
};
</script>

<template>
  <Login v-if="!isRegistered" @login-success="onLoginSuccess" />

  <template v-else>
    <Header 
      v-model:tabActual="tabActual"
      :isRegistered="isRegistered"
      :speed="testData.speed"
      :ping="testData.ping"
      :status="{ label: testData.statusLabel, class: testData.statusClass }"
      @openMiniDashboard="openMiniDashboard"
      @triggerLogout="showModal = true"
    />
    
    <InternetTest v-if="tabActual === 'test'" @test-complete="handleTestComplete" />
    
    <div v-else-if="tabActual === 'mapa'" class="container" :class="{ 'dashboard-mode': isRegistered }">
      <div class="dashboard-view">
        <HeatMap />
      </div>
    </div>
    
    <div v-else-if="tabActual === 'config'" class="container" :class="{ 'dashboard-mode': isRegistered }">
      <div class="dashboard-view">
        <Settings />
      </div>
    </div>
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