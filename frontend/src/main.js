import { createApp } from 'vue'
import './theme.css'
import App from './App.vue'
import router from './router'
import { OhVueIcon, addIcons } from 'oh-vue-icons';

import { 
  FaHippo, 
  MdSpeed, 
  RiMap2Line,
  FaMapMarkerAlt,
  BiTable,
  BiWindow,
  MdDesktopwindows,
  MdSettings 
} from "oh-vue-icons/icons";

addIcons(
  FaHippo, 
  MdSpeed, 
  RiMap2Line,
  FaMapMarkerAlt,
  BiTable,
  BiWindow,
  MdDesktopwindows,
  MdSettings
);

const app = createApp(App)

app.component("v-icon", OhVueIcon);
app.use(router)
app.mount('#app')
