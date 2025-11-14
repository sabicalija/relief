/**
 * FontAwesome icon configuration
 * This plugin sets up FontAwesome icons for the application
 */
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// Import icons
import {
  faSpinner,
  faImage,
  faFileImage,
  faArrowsUpDownLeftRight,
  faRotate,
  faRotateLeft,
  faMaximize,
  faCheck,
  faExclamationTriangle,
  faCube,
  faSquare,
  faAnglesDown,
  faAnglesUp,
  faChevronLeft,
  faChevronRight,
  faAngleRight,
  faAngleDown,
  faEye,
  faRulerCombined,
  faCameraRotate,
  faPalette,
  faTimes,
  faDownload,
  faSlidersH,
  faUpload,
  faWandMagicSparkles,
  faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";

// Add icons to library
library.add(
  faSpinner,
  faImage,
  faFileImage,
  faArrowsUpDownLeftRight,
  faRotate,
  faRotateLeft,
  faMaximize,
  faCheck,
  faExclamationTriangle,
  faCube,
  faSquare,
  faAnglesDown,
  faAnglesUp,
  faChevronLeft,
  faChevronRight,
  faAngleRight,
  faAngleDown,
  faEye,
  faRulerCombined,
  faCameraRotate,
  faPalette,
  faTimes,
  faDownload,
  faSlidersH,
  faUpload,
  faWandMagicSparkles,
  faCircleNotch
);

/**
 * Install FontAwesome plugin
 * @param {App} app - Vue app instance
 */
export default {
  install(app) {
    // Register FontAwesome component globally
    app.component("font-awesome-icon", FontAwesomeIcon);
  },
};
