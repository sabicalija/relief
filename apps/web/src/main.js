import { createApp } from "vue";
import { createPinia } from "pinia";
import "./assets/style.css";
import "./styles/vars.scss"; // Import global CSS custom properties
import App from "./App.vue";
import iconsPlugin from "./plugins/icons";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(iconsPlugin);
app.mount("#app");
