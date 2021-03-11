<template>
  <div class="VueCarousel-slide" ref="multiSlide" v-on:click="emitClick">
    <div
      v-for="slideObj in slide.slides"
      v-html="slideObj.innerHTML"
      v-on:click="slideClick(slideObj.attrs)"
    ></div>
  </div>
</template>

<script>
export default {
  name: "multi-row-slides",
  data() {
    return {
      width: null
    };
  },
  methods: {
    emitClick() {
      console.log(`emitClick ${this.index}`);
      if (this.$parent.isThumbNav) {
        this.$parent.itemClicked(this._uid);
      }
    },
    slideClick(attrs) {
      // console.log('slideClick')
      // console.log(attrs.code)
      this.$emit("slideClick", attrs);
    }
  },
  mounted() {
    if (!this.$isServer) {
      this.$el.addEventListener("dragstart", e => e.preventDefault());
    }
    // this.$refs.multiSlide.innerHTML = this.slide.innerHTML;
  },
  /* props: {
    slide: {
      type: Object
    },
    index: {
      type: Number
    }
  }*/
  props: ["slide"]
};
</script>

<style>
.VueCarousel-slide {
  flex-basis: inherit;
  flex-grow: 0;
  flex-shrink: 0;
  user-select: none;
  backface-visibility: hidden;
  -webkit-touch-callout: none;
}
</style>
