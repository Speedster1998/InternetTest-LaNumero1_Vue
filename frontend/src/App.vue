<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Header from './components/Header/Header.vue';
import { toggleMiniDashboard } from './components/MiniDashboard/MiniDashboard.vue';

const router = useRouter();
const route = useRoute();
const isMiniDashboardOpen = ref(false);

const testData = ref({
  speed: null,
  ping: null,
  statusLabel: 'Sin datos',
  statusClass: ''
});

const handleTestComplete = (data) => {
  testData.value = data;
  if (isMiniDashboardOpen.value) {
    toggleMiniDashboard(data);
  }
};

const openMiniDashboard = () => {
  isMiniDashboardOpen.value = true;
  const popupRef = toggleMiniDashboard(testData.value); 
  
  // Si el usuario cierra la ventana con la "X" del navegador,
  // reiniciamos nuestro estado para que NO se vuelva a abrir sola en el siguiente test.
  if (popupRef) {
    const timer = setInterval(() => {
      if (popupRef.closed) {
        clearInterval(timer);
        isMiniDashboardOpen.value = false;
      }
    }, 500); // Revisa cada medio segundo de forma ultra ligera
  }
};
</script>

<template>
  <Header 
    v-if="route && route.path && route.path !== '/login'"
    :speed="testData.speed"
    :ping="testData.ping"
    :status="{ label: testData.statusLabel, class: testData.statusClass }"
    @openMiniDashboard="openMiniDashboard"
  />
    
  <div v-if="route.path === '/mapa' || route.path === '/config'" 
       class="container dashboard-mode" 
       :class="{ 'container-map': route.path === '/mapa' }">
    <div class="dashboard-view">
      <router-view @test-complete="handleTestComplete" />
    </div>
  </div>

  <template v-else>
    <router-view @test-complete="handleTestComplete" />
  </template>
</template>