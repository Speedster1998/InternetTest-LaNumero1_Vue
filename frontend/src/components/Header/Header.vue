<script setup>
import { ref } from 'vue';
import '../Header/Header.css';

// Recibimos las variables necesarias del padre para mantener la reactividad
const props = defineProps({
  isRegistered: Boolean,
  tabActual: String,
  speed: [Number, String],
  ping: Number,
  status: Object
});

// Avisamos al padre cuando ocurren acciones de navegación o logout
const emit = defineEmits(['update:tabActual', 'openMiniDashboard', 'triggerLogout']);

const isOpenMenu = ref(false);
const menuRef = ref(null);

// Método auxiliar para cambiar de tab y cerrar la barra lateral
const cambiarTab = (nuevaTab) => {
  emit('update:tabActual', nuevaTab);
  isOpenMenu.value = false;
};
</script>

<template>
  <header v-if="isRegistered" class="global-navbar">
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
            <li v-if="tabActual !== 'test'" @click="cambiarTab('test')">Test de Velocidad</li>
            <li v-if="tabActual !== 'mapa'" @click="cambiarTab('mapa')">Mapa de Calor (Beta)</li>
            <li>
              <a href="https://docs.google.com/spreadsheets/d/1tbrV3TdS-yZvtNG-Tv0XnKayqU5IdllZkisGg_wNkLo/edit?usp=sharing" target="_blank">
                Reporte del tráfico de datos
              </a>
            </li>
            <li @click="emit('openMiniDashboard'); isOpenMenu = false">
              Ventana Resumen
            </li>
            <li>
              <a href="https://intranet.grupolanumero1.com.pe/" target="_blank">
                Intranet La Número 1
              </a>
            </li>
            <li v-if="tabActual !== 'config'" @click="cambiarTab('config')">Configuración</li>
          </ul>
        </nav>
      </div>

      <div class="header-center">
        <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" alt="lanumero1" class="main-logo" />
      </div>

      <div class="header-right">
        <button @click="emit('triggerLogout')" class="logout-circle-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" stroke="white" stroke-width="2" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>      
    </div>
  </header>
</template>