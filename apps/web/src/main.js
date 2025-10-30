import { createApp } from "vue";
import { createPinia } from "pinia";
import "./assets/style.css";
import "./styles/vars.scss"; // Import global CSS custom properties
import App from "./App.vue";

// FontAwesome
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// Add icons to library
library.add(faSpinner);

const app = createApp(App);
const pinia = createPinia();

// Register FontAwesome component globally
app.component("font-awesome-icon", FontAwesomeIcon);

app.use(pinia);
app.mount("#app");
