<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import '../Header/Header.css';

defineProps({
  isRegistered: Boolean,
});

const emit = defineEmits(['openMiniDashboard']);

const router = useRouter();
const route = useRoute();

const isOpenMenu = ref(false);
const menuRef = ref(null);
const showModal = ref(false);

const cambiarTab = (rutaDestino) => {
  router.push(rutaDestino);
  isOpenMenu.value = false;   // Cierra la barra lateral
};

const confirmLogout = () => {
  localStorage.clear();
  showModal.value = false;
  router.push('/login');
};
</script>

<template>
  <header class="global-navbar">
    <div class="nav-content">
      <div class="header-left">
        <button class="menu-grid-btn" @click="isOpenMenu = true">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div v-if="isOpenMenu" class="menu-overlay" @click="isOpenMenu = false"></div>

        <nav :class="['sidebar-menu', { 'is-open': isOpenMenu }]" ref="menuRef">
          <div class="sidebar-header">
            <img src="/La_Numero_1_logo_negro.png" alt="Logo" class="sidebar-logo" />
            <button class="close-btn" @click="isOpenMenu = false">&times;</button>
          </div>

          <ul class="sidebar-links">
            <li v-if="route.path !== '/test'" @click="cambiarTab('/test')">
              <v-icon name="md-speed" scale="1.1" /> Test de Velocidad
            </li>
            <li v-if="route.path !== '/maps'" @click="cambiarTab('/maps')">
              <v-icon name="fa-map-marker-alt" scale="1.1" /> Mapa de Calor
            </li>
            <li v-if="route.path !== '/results'" @click="cambiarTab('/results')">
              <v-icon name="bi-table" scale="1.1" /> Resultados de los Test
            </li>
            <li @click="emit('openMiniDashboard'); isOpenMenu = false">
              <v-icon name="bi-window" scale="1.1" stroke="currentColor" stroke-width="0.5" /> Ventana Resumen
            </li>
            <li>
              <v-icon name="md-desktopwindows" scale="1.05" />
              <a href="https://intranet.grupolanumero1.com.pe/" target="_blank">
                Intranet La Número 1
              </a>
            </li>
            <li v-if="route.path !== '/config'" @click="cambiarTab('/config')">
              <v-icon name="md-settings" scale="1.1" /> Configuración
            </li>
          </ul>
        </nav>
      </div>

      <div class="header-center">
        <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" alt="lanumero1" class="main-logo" />
      </div>

      <div class="header-right">
        <button @click="showModal = true" class="logout-circle-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" stroke-width="2" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>      
    </div>
  </header>

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