import Carousel from "./Carousel.vue";
import Slide from "./Slide.vue";
import Thumbnails from "./Thumbnails.vue";

// const install = Vue => {
//   Vue.component("carousel", Carousel);
//   Vue.component("slide", Slide);
//   Vue.component("thumbnails", Thumbnails);
// };
//
// export default {
//   install
// };

Vue.component("carousel", Carousel);
Vue.component("slide", Slide);
Vue.component("thumbnails", Thumbnails);

export { Carousel, Slide, Thumbnails };
