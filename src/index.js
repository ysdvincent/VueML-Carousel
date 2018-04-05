import Carousel from "./Carousel.vue";
import Slide from "./Slide.vue";
import MultiRowSlide from "./MultiRowSlide.vue";
import Thumbnails from "./ThumbnailNav.vue";

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
Vue.component("multi-row-slide", MultiRowSlide);
Vue.component("thumbnails", Thumbnails);

export { Carousel, Slide, Thumbnails };
