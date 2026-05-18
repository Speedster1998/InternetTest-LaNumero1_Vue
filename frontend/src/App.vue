<script setup>
import { ref } from 'vue';
import Login from './pages/Login/Login.vue';
import InternetTest from './pages/InternetTest/InternetTest.vue';

const isRegistered = ref(!!localStorage.getItem('userName'));

const onLoginSuccess = () => {
  isRegistered.value = true;
};

const onLogout = () => {
  isRegistered.value = false;
};
</script>

<template>
  <Login v-if="!isRegistered" @login-success="onLoginSuccess" />
  <InternetTest v-else @logout="onLogout" />
</template>