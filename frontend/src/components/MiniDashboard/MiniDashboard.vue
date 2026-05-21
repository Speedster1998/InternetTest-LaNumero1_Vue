<script setup>
import { computed } from 'vue';

const props = defineProps({
  speed: [Number, String],
  ping: [Number, String],
  statusLabel: String,
  statusClass: String,
  techImg: String
});

const colorMap = {
  'status-low': { bg: '#f8d7da', text: '#721c24' },
  'status-mod': { bg: '#fff3cd', text: '#856404' },
  'status-opt': { bg: '#d4edda', text: '#155724' },
  'status-exc': { bg: '#d1ecf1', text: '#328df4' }
};

const colors = computed(() => colorMap[props.statusClass] || { bg: '#e2e3e5', text: '#383d41' });
const horaActual = computed(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
</script>

<template>
  <div class="mini-dashboard-wrapper">
    <div class="card">
      <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" width="120" class="logo-header" />
      
      <div class="dashboard-container">
        <div class="speed-section">
          <div class="label">Velocidad Actual</div>
          <div class="value">
            {{ speed || '--' }} <small style="font-size: 1.1rem">Mbps</small>
          </div>
        </div>

        <div class="info-section">
          <div class="label">Latencia (Ping)</div>
          <div class="ping">{{ ping || '--' }} ms</div>
          <div class="status" :style="{ backgroundColor: colors.bg, color: colors.text }">
            {{ statusLabel || 'Sin datos' }}
          </div>
        </div>
      </div>

      <div class="footer">Actualizado: {{ horaActual }}</div>
    </div>
  </div>
</template>