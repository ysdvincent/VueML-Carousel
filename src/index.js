import Carousel from "./Carousel.vue";
import Slide from "./Slide.vue";
import MultiRowSlide from "./MultiRowSlide.vue";
import Thumbnails from "./ThumbnailNav.vue";

const install = Vue => {
  Vue.component("vueml-carousel", Carousel);
  Vue.component("vueml-slide", Slide);
  Vue.component("multi-row-slide", MultiRowSlide);
  Vue.component("thumbnails", Thumbnails);
};

export default {
  install
};
