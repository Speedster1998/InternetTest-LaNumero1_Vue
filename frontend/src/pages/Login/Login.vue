<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiUrl } from '../../config/api';
import '../Login/Login.css';

const router = useRouter();

const userName = ref('');
const baseNumber = ref('');
const selectedId = ref(null);
const isOpen = ref(false);
const sedes = ref([]);

onMounted(async () => {
  try {
    const response = await fetch(apiUrl('/sedes'));
    if (response.ok) {
      sedes.value = await response.json();
    } else {
      console.error("Error al obtener sedes desde el servidor");
    }
  } catch (error) {
    console.error("No se pudo conectar con el backend de La Numero 1:", error);
  }
});

const selectSede = (sede) => {
  baseNumber.value = `${sede.cod_ubi} - ${sede.lugar}`;
  selectedId.value = sede.id_ubicacion;
  isOpen.value = false;
};

const handleLogin = () => {
  if (userName.value.trim() && baseNumber.value.trim()) {
    localStorage.setItem('userName', userName.value);
    localStorage.setItem('baseNumber', baseNumber.value);
    localStorage.setItem('idProvincia', selectedId.value);
    router.push('/test');
  } else {
    alert("Por favor, completa ambos campos.");
  }
};
</script>

<template>
  <div class="container">
    <form @submit.prevent="handleLogin" class="login-form">
      <img src="https://cdn.shopify.com/s/files/1/0383/1984/9609/files/logo-color-lanumero1.png" alt="lanumero1" id="lanumero1" width="260" />
      <h1>Registro del Usuario</h1>
      <p>Ingrese sus datos para iniciar la prueba:</p>
      <input v-model="userName" type="text" placeholder="Nombres y Apellidos" required />
      
      <div class="custom-select-wrapper">
        <div class="select-trigger" :class="{ active: isOpen }" @click="isOpen = !isOpen">
          <span>{{ baseNumber || "Selecciona tu Base" }}</span>
          <i class="arrow-icon"></i>
        </div>
        <ul v-if="isOpen" class="select-options-list">
          <li v-for="sede in sedes" :key="sede.id_ubicacion" 
              @click="selectSede(sede)"
              :class="{ selected: selectedId === sede.id_ubicacion }">
            {{ sede.cod_ubi }} - {{ sede.lugar }}
          </li>
        </ul>
      </div>
      <button type="submit">Continuar</button>
    </form>
  </div>
</template>