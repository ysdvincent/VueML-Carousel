<template>
  <div class="VueCarousel">
    <div class="VueCarousel-wrapper" ref="VueCarousel-wrapper">
      <div
        class="VueCarousel-inner"
        v-bind:style="
          `
          transform: translate3d(${currentOffset}px, 0, 0);
          transition: ${!dragging ? transitionStyle : 'none'};
          flex-basis: ${slideWidth}px;
          visibility: ${slideWidth ? 'visible' : 'hidden'};
          padding-left: ${padding}px;
          padding-right: ${padding}px;
        `
        "
      >
        <template v-if="multiRow">
          <multi-row-slide
            v-for="(slide, key) in multiRowData"
            :slide="slide"
            :key="key"
            :index="key"
            @slideClick="slideClick"
          />
        </template>
        <template v-else>
          <slot name="default"></slot>
        </template>
      </div>
    </div>
    <pagination
      v-if="paginationEnabled && pageCount > 0"
      @paginationclick="goToPage($event, 'pagination')"
    />
    <navigation
      v-if="navigationEnabled"
      :clickTargetSize="navigationClickTargetSize"
      :nextLabel="navigationNextLabel"
      :prevLabel="navigationPrevLabel"
      @navigationclick="handleNavigation"
    />
    <thumbnail-nav
      v-if="thumbNavEnabled"
      :slides="$slots"
      :perPage="thumbNavPerPage"
      :perPageCustom="thumbNavPerPageCustom"
      :navigationEnabled="true"
      :paginationEnabled="false"
      :scrollPerPage="false"
      ref="thumbNav"
    />
  </div>
</template>

<script>
import autoplay from "./mixins/autoplay";
import debounce from "./utils/debounce";
import Navigation from "./Navigation.vue";
import Pagination from "./Pagination.vue";
import Slide from "./Slide.vue";
import MultiRowSlide from "./MultiRowSlide.vue";
import ThumbnailNav from "./ThumbnailNav.vue";

export default {
  name: "vueml-carousel",
  beforeUpdate() {
    this.computeCarouselWidth();
  },
  components: {
    Navigation,
    Pagination,
    Slide,
    MultiRowSlide,
    ThumbnailNav
  },
  data() {
    return {
      browserWidth: null,
      carouselWidth: null,
      currentPage: 0,
      dragging: false,
      dragMomentum: 0,
      dragOffset: 0,
      dragStartY: 0,
      dragStartX: 0,
      isTouch: typeof window !== "undefined" && "ontouchstart" in window,
      offset: 0,
      refreshRate: 16,
      slideCount: 0,
      perPageThumb: 4,
      thumbNav: null,
      multiRow: false,
      multiRowData: "",
      useDrag: false
    };
  },
  mixins: [autoplay],
  props: {
    /**
     * Slide transition easing
     * Any valid CSS transition easing accepted
     */
    easing: {
      type: String,
      default: "ease"
    },
    /**
     * Minimum distance for the swipe to trigger
     * a slide advance
     */
    minSwipeDistance: {
      type: Number,
      default: 8
    },
    /**
     * Amount of padding to apply around the label in pixels
     */
    navigationClickTargetSize: {
      type: Number,
      default: 8
    },
    /*
     * Flag to toggle mouse dragging
     */
    mouseDrag: {
      type: Boolean,
      default: true
    },
    /**
     * Flag to render the navigation component
     * (next/prev buttons)
     */
    navigationEnabled: {
      type: Boolean,
      default: false
    },
    /**
     * Text content of the navigation next button
     */
    navigationNextLabel: {
      type: String,
      default: "▶"
    },
    /**
     * Text content of the navigation prev button
     */
    navigationPrevLabel: {
      type: String,
      default: "◀"
    },
    /**
     * The fill color of the active pagination dot
     * Any valid CSS color is accepted
     */
    paginationActiveColor: {
      type: String,
      default: "#000000"
    },
    /**
     * The fill color of pagination dots
     * Any valid CSS color is accepted
     */
    paginationColor: {
      type: String,
      default: "#efefef"
    },
    /**
     * Flag to render pagination component
     */
    paginationEnabled: {
      type: Boolean,
      default: true
    },
    /**
     * The padding inside each pagination dot
     * Pixel values are accepted
     */
    paginationPadding: {
      type: Number,
      default: 10
    },
    /**
     * The size of each pagination dot
     * Pixel values are accepted
     */
    paginationSize: {
      type: Number,
      default: 10
    },
    /**
     * Maximum number of slides displayed on each page
     */
    perPage: {
      type: Number,
      default: 2
    },
    /**
     * Configure the number of visible slides with a particular browser width.
     * This will be an array of arrays, ex. [[320, 2], [1199, 4]]
     * Formatted as [x, y] where x=browser width, and y=number of slides displayed.
     * ex. [1199, 4] means if (window <= 1199) then show 4 slides per page
     */
    perPageCustom: {
      type: Array
    },
    /**
     * Resistance coefficient to dragging on the edge of the carousel
     * This dictates the effect of the pull as you move towards the boundaries
     */
    resistanceCoef: {
      type: Number,
      default: 20
    },
    /**
     * Scroll per page, not per item
     */
    scrollPerPage: {
      type: Boolean,
      default: false
    },
    /**
     * Slide transition speed
     * Number of milliseconds accepted
     */
    speed: {
      type: Number,
      default: 500
    },
    /**
     * Flag to make the carousel loop around when it reaches the end
     */
    loop: {
      type: Boolean,
      default: false
    },
    /**
     * Listen for an external navigation request using this prop.
     */
    navigateTo: {
      type: Number,
      default: 0
    },
    /**
     *  Stage padding option adds left and right padding style (in pixels) onto VueCarousel-inner.
     */
    spacePadding: {
      type: Number,
      default: 0
    },
    /**
     * Enables the thumbnail carousel below the main carousel. It also forces
     * the main carousel to be a single item.
     */
    thumbNavEnabled: {
      type: Boolean,
      default: false
    },
    /**
     * Sets the number of thumbnail slides per page.
     */
    thumbNavPerPage: {
      type: Number,
      default: 4
    },
    /**
     * Sets the number of thumbnail slides per page for differnet viewport sizes
     */
    thumbNavPerPageCustom: {
      type: Array,
      validator(values) {
        return (
          Array.isArray(values) &&
          values.every(
            pair => Array.isArray(pair) && pair.every(Number.isSafeInteger)
          )
        );
      }
    },
    /**
     * Sets the number of rows per slide in the
     */
    slideRows: {
      type: Number,
      default: 1
    }
  },

  watch: {
    navigateTo(val) {
      if (val !== this.currentPage) this.goToPage(val);
    }
  },

  computed: {
    /**
     * Given a viewport width, find the number of slides to display
     * @param  {Number} width Current viewport width in pixels
     * @return {Number} Number of slides to display
     */
    breakpointSlidesPerPage() {
      if (!this.perPageCustom) {
        return this.perPage;
      }

      const breakpointArray = this.perPageCustom;
      const width = this.browserWidth;

      const breakpoints = breakpointArray.sort((a, b) =>
        a[0] > b[0] ? -1 : 1
      );

      // Reduce the breakpoints to entries where the width is in range
      // The breakpoint arrays are formatted as [widthToMatch, numberOfSlides]
      const matches = breakpoints.filter(breakpoint => width >= breakpoint[0]);

      // If there is a match, the result should return only
      // the slide count from the first matching breakpoint
      const match = matches[0] && matches[0][1];

      return match || this.perPage;
    },
    /**
     * @return {Boolean} Can the slider move forward?
     */
    canAdvanceForward() {
      return this.loop || this.currentPage < this.pageCount - 1;
    },
    /**
     * @return {Boolean} Can the slider move backward?
     */
    canAdvanceBackward() {
      return this.loop || this.currentPage > 0;
    },
    /**
     * Number of slides to display per page in the current context.
     * This is constant unless responsive perPage option is set.
     * @return {Number} The number of slides per page to display
     */
    currentPerPage() {
      if (this.thumbNavEnabled) {
        return 1;
      } else {
        return !this.perPageCustom || this.$isServer
          ? this.perPage
          : this.breakpointSlidesPerPage;
      }
    },
    /**
     * The horizontal distance the inner wrapper is offset while navigating.
     * @return {Number} Pixel value of offset to apply
     */
    currentOffset() {
      return (this.offset + this.dragOffset) * -1;
    },
    isHidden() {
      return this.carouselWidth <= 0;
    },
    maxOffset() {
      return this.slideWidth * this.slideCount - this.carouselWidth;
    },
    /**
     * Calculate the number of pages of slides
     * @return {Number} Number of pages
     */
    pageCount() {
      return Math.ceil(this.slideCount / this.currentPerPage);
    },
    /**
     * Calculate the width of each slide
     * @return {Number} Slide width
     */
    slideWidth() {
      const width = this.carouselWidth - this.spacePadding * 2;
      const perPage = this.currentPerPage;
      return Math.floor(width / perPage);
    },
    transitionStyle() {
      return `${this.speed / 1000}s ${this.easing} transform`;
    },
    padding() {
      const padding = this.spacePadding;
      return padding > 0 ? padding : false;
    }
  },
  methods: {
    /**
     * @return {Number} The index of the next page
     * */
    getNextPage() {
      if (this.currentPage < this.pageCount - 1) {
        return this.currentPage + 1;
      }
      return this.loop ? 0 : this.currentPage;
    },
    /**
     * @return {Number} The index of the previous page
     * */
    getPreviousPage() {
      if (this.currentPage > 0) {
        return this.currentPage - 1;
      }
      return this.loop ? this.pageCount - 1 : this.currentPage;
    },
    /**
     * Increase/decrease the current page value
     * @param  {String} direction (Optional) The direction to advance
     */
    advancePage(direction) {
      if (direction && direction === "backward" && this.canAdvanceBackward) {
        this.goToPage(this.getPreviousPage(), "navigation");
      } else if (
        (!direction || (direction && direction !== "backward")) &&
        this.canAdvanceForward
      ) {
        this.goToPage(this.getNextPage(), "navigation");
      }

      this.updateThumbNav();
    },
    /**
     * A mutation observer is used to detect changes to the containing node
     * in order to keep the magnet container in sync with the height its reference node.
     */
    attachMutationObserver() {
      const MutationObserver =
        window.MutationObserver ||
        window.WebKitMutationObserver ||
        window.MozMutationObserver;

      if (MutationObserver) {
        const config = { attributes: true, data: true };
        this.mutationObserver = new MutationObserver(() => {
          this.$nextTick(() => {
            this.computeCarouselWidth();
          });
        });
        if (this.$parent.$el) {
          this.mutationObserver.observe(this.$parent.$el, config);
        }
      }
    },
    handleNavigation(direction) {
      this.$emit("navigationclick", direction);
    },
    /**
     * Stop listening to mutation changes
     */
    detachMutationObserver() {
      if (this.mutationObserver) {
        this.mutationObserver.disconnect();
      }
    },
    /**
     * Get the current browser viewport width
     * @return {Number} Browser"s width in pixels
     */
    getBrowserWidth() {
      this.browserWidth = window.innerWidth;
      return this.browserWidth;
    },
    /**
     * Get the width of the carousel DOM element
     * @return {Number} Width of the carousel in pixels
     */
    getCarouselWidth() {
      this.carouselWidth = (this.$el && this.$el.clientWidth) || 0; // Assign globally
      return this.carouselWidth;
    },
    /**
     * Filter slot contents to slide instances and return length
     * @return {Number} The number of slides
     */
    getSlideCount() {
      const slots =
        (this.$slots &&
          this.$slots.default &&
          this.$slots.default.filter(
            slot => slot.tag && slot.tag.indexOf("slide") > -1
          ).length) ||
        0;
      this.slideCount =
        this.slideRows > 1 ? Math.ceil(slots / this.slideRows) : slots;
    },
    /**
     * Set the current page to a specific value
     * This function will only apply the change if the value is within the carousel bounds
     * @param  {Number} page The value of the new page number
     */
    goToPage(page) {
      if (page >= 0 && page <= this.pageCount) {
        this.offset = Math.min(
          Math.floor(this.slideWidth) * Math.floor(this.currentPerPage) * page,
          this.maxOffset
        );
        this.currentPage = page;
        this.$emit("pagechange", this.currentPage);
      }
    },
    /**
     * Trigger actions when mouse is pressed
     * @param  {Object} e The event object
     */
    /* istanbul ignore next */
    onStart(e) {
      // console.log('start drag')
      document.addEventListener(
        this.isTouch ? "touchend" : "mouseup",
        this.onEnd,
        true
      );

      document.addEventListener(
        this.isTouch ? "touchmove" : "mousemove",
        this.onDrag,
        true
      );

      this.startTime = e.timeStamp;
      this.dragging = true;
      this.dragStartX = this.isTouch ? e.touches[0].clientX : e.clientX;
      this.dragStartY = this.isTouch ? e.touches[0].clientY : e.clientY;
    },
    /**
     * Trigger actions when mouse is released
     * @param  {Object} e The event object
     */
    onEnd(e) {
      // console.log('end drag')
      // compute the momemtum speed
      const eventPosX = this.isTouch ? e.changedTouches[0].clientX : e.clientX;
      const deltaX = this.dragStartX - eventPosX;
      this.dragMomentum = deltaX / (e.timeStamp - this.startTime);

      // take care of the minSwipteDistance prop, if not 0 and delta is bigger than delta
      if (
        this.minSwipeDistance !== 0 &&
        Math.abs(deltaX) >= this.minSwipeDistance
      ) {
        const width = this.scrollPerPage
          ? this.slideWidth * Math.floor(this.currentPerPage)
          : this.slideWidth;
        this.dragOffset = this.dragOffset + Math.sign(deltaX) * (width / 2);
      }

      console.log(this.dragOffset);
      if (this.dragOffset > -10 && this.dragOffset < 10) {
        this.useDrag = false;
      } else {
        this.useDrag = true;
      }

      this.offset += this.dragOffset;
      this.dragOffset = 0;

      // setTimeout(()=>{
      //   this.dragging = false;
      // },100)
      this.dragging = false;

      this.render();

      // clear events listeners
      document.removeEventListener(
        this.isTouch ? "touchend" : "mouseup",
        this.onEnd,
        true
      );
      document.removeEventListener(
        this.isTouch ? "touchmove" : "mousemove",
        this.onDrag,
        true
      );
    },
    /**
     * Trigger actions when mouse is pressed and then moved (mouse drag)
     * @param  {Object} e The event object
     */
    onDrag(e) {
      const eventPosX = this.isTouch ? e.touches[0].clientX : e.clientX;
      const eventPosY = this.isTouch ? e.touches[0].clientY : e.clientY;
      const newOffsetX = this.dragStartX - eventPosX;
      const newOffsetY = this.dragStartY - eventPosY;

      // if it is a touch device, check if we are below the min swipe threshold
      // (if user scroll the page on the component)
      if (this.isTouch && Math.abs(newOffsetX) < Math.abs(newOffsetY)) {
        return;
      }

      // we are good to prevent the move and handle the translation
      e.preventDefault();
      e.stopImmediatePropagation();

      this.dragOffset = newOffsetX;
      const nextOffset = this.offset + this.dragOffset;
      if (nextOffset < 0) {
        this.dragOffset = -Math.sqrt(-this.resistanceCoef * this.dragOffset);
      } else if (nextOffset > this.maxOffset) {
        this.dragOffset = Math.sqrt(this.resistanceCoef * this.dragOffset);
      }
    },
    onResize() {
      this.computeCarouselWidth();

      this.dragging = true; // force a dragging to disable animation
      this.render();
      // clear dragging after refresh rate
      setTimeout(() => {
        this.dragging = false;
      }, this.refreshRate);
    },
    render() {
      // add extra slides depending on the momemtum speed
      this.offset +=
        Math.max(
          -this.currentPerPage + 1,
          Math.min(Math.round(this.dragMomentum), this.currentPerPage - 1)
        ) * this.slideWidth;

      // & snap the new offset on a slide or page if scrollPerPage
      const width = this.scrollPerPage
        ? this.slideWidth * Math.floor(this.currentPerPage)
        : this.slideWidth;
      this.offset = width * Math.round(this.offset / width);

      // clamp the offset between 0 -> maxOffset
      this.offset = Math.max(0, Math.min(this.offset, this.maxOffset));

      // update the current page
      this.currentPage = Math.round(
        this.offset / this.slideWidth / this.currentPerPage
      );

      this.updateThumbNav();
    },
    /**
     * Re-compute the width of the carousel and its slides
     */
    computeCarouselWidth() {
      this.getSlideCount();
      this.getBrowserWidth();
      this.getCarouselWidth();
      this.setCurrentPageInBounds();
    },
    /**
     * When the current page exceeds the carousel bounds, reset it to the maximum allowed
     */
    setCurrentPageInBounds() {
      if (!this.canAdvanceForward) {
        const setPage = this.pageCount - 1;
        this.currentPage = setPage >= 0 ? setPage : 0;
        this.offset = Math.max(0, Math.min(this.offset, this.maxOffset));
      }
    },
    updateThumbNav(slide) {
      if (this.thumbNavEnabled) {
        if (!slide) {
          slide = Math.round(this.offset / this.slideWidth);
        }
        this.thumbNav.goToSlide(slide);
      }
    },
    createRowSlides() {
      if (this.slideRows > 1) {
        let newSlides = [];
        let key = 0;
        let curRow = 1;
        this.$slots.default.forEach((slide, i) => {
          if (slide && slide.elm && slide.elm.innerHTML) {
            if (curRow === 1) {
              // Add new slide
              newSlides[key] = {
                // innerHTML: slide.elm.innerHTML,
                slides: [
                  {
                    innerHTML: slide.elm.innerHTML,
                    attrs: slide.data.attrs
                  }
                ]
              };
              curRow++;
            } else {
              // Add new row to current slide
              // newSlides[key]["innerHTML"] += slide.elm.innerHTML;
              newSlides[key].slides.push({
                innerHTML: slide.elm.innerHTML,
                attrs: slide.data.attrs
              });
              curRow++;
            }

            if (curRow > this.slideRows) {
              key++;
              curRow = 1;
            }
          }
        });
        this.multiRowData = newSlides;
        this.multiRow = true;
      }
    },
    slideClick(attrs) {
      if (!this.useDrag) {
        console.log("click");
        this.$emit("slideClick", attrs);
      } else {
        console.log("dragging, prevent drag");
      }
    }
  },
  mounted() {
    if (!this.$isServer) {
      window.addEventListener(
        "resize",
        debounce(this.onResize, this.refreshRate)
      );

      // setup the start event only if touch device or mousedrag activated
      if (this.isTouch || this.mouseDrag) {
        this.$refs["VueCarousel-wrapper"].addEventListener(
          this.isTouch ? "touchstart" : "mousedown",
          this.onStart
        );
      }
    }

    this.attachMutationObserver();
    this.computeCarouselWidth();

    this.thumbNav = this.$refs.thumbNav;

    if (this.slideRows > 1) {
      this.createRowSlides();
    }
  },
  beforeDestroy() {
    if (!this.$isServer) {
      this.detachMutationObserver();
      window.removeEventListener("resize", this.getBrowserWidth);
      this.$refs["VueCarousel-wrapper"].removeEventListener(
        this.isTouch ? "touchstart" : "mousedown",
        this.onStart
      );
    }
  }
};
</script>

<style>
.VueCarousel {
  position: relative;
}

.VueCarousel-wrapper {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.VueCarousel-inner {
  display: flex;
  flex-direction: row;
  backface-visibility: hidden;
}
</style>
