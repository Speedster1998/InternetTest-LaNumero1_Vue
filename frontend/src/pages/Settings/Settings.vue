<script setup>
import { ref, watch, computed } from 'vue';
import '../Settings/Settings.css';

const mode = ref(localStorage.getItem('testMode') || 'both'); // 'manual' o 'both'
const interval = ref(parseInt(localStorage.getItem('testInterval')) || 60); // En minutos

const isAutoEnabled = computed({
  get: () => mode.value === 'both',
  set: (val) => { mode.value = val ? 'both' : 'manual'; }
});

// Cambio de color del status-text
const statusClass = computed(() => {
  return isAutoEnabled.value ? 'status-on' : 'status-off';
});

watch([mode, interval], (newValues) => {
  const [newMode, newInterval] = newValues; // Desestructuramos para ver qué llega
  
  localStorage.setItem('testMode', newMode);
  localStorage.setItem('testInterval', newInterval.toString());
  
  // Enviamos el evento
  window.dispatchEvent(new Event('config-updated'));
  console.log(`Evento enviado: Modo=${newMode}, Intervalo=${newInterval} (Tipo: ${typeof newInterval})`);
});

const showSuccessModal = ref(false);

const saveConfig = () => {
  // 1. Guardamos en el disco
  localStorage.setItem('testMode', mode.value);
  localStorage.setItem('testInterval', interval.value.toString());

  // 2. Lanzamos el grito para que InternetTest.vue se entere
  window.dispatchEvent(new Event('config-updated'));

  // 3. Mostramos el Pop-up de éxito
  showSuccessModal.value = true;
  
  console.log("Configuración guardada manualmente.");
};
</script>

<template>
  <div class="settings-view">
    <h1>Configuración del Sistema</h1>
    
    <div class="setting-group switch-group">
      <label class="switch-label">Modo de Test Automático:</label>
      <div class="switch-wrapper">
        <span :class="['status-text', statusClass]">{{ isAutoEnabled ? 'Activado' : 'Desactivado' }}</span>
        <label class="switch">
          <input type="checkbox" v-model="isAutoEnabled">
          <span class="slider round"></span>
        </label>
      </div>
    </div>

    <div class="setting-group" :class="{ disabled: !isAutoEnabled }">
      <label>Frecuencia del Test Automático:</label>
      <select v-model.number="interval" :disabled="!isAutoEnabled">
        <option value="1">Cada minuto</option>
        <option value="10">Cada 10 minutos</option>
        <option value="30">Cada 30 minutos</option>
        <option value="60">Cada hora</option>
      </select>
    </div>

    <button class="btn-save" @click="saveConfig">Guardar Cambios</button>
  </div>

  <Teleport to="body">
    <transition name="pop-in"> <div v-if="showSuccessModal" class="modal-overlay" @click.self="showSuccessModal = false">
        <div class="modal-content success-popup">

          <div class="success-icon-container">
            <svg viewBox="0 0 52 52" class="success-icon-svg">
              <circle class="success-icon-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="success-icon-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>

          <h2>Cambios guardados</h2>
          <p>La configuración se ha actualizado correctamente.</p>
          
          <div class="modal-buttons">
            <button @click="showSuccessModal = false" class="btn-confirm btn-success">Aceptar</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>