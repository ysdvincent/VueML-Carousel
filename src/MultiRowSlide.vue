<template>
  <div class="VueMLCarousel-slide" ref="multiSlide" v-on:click="emitClick"></div>
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
      if (this.$parent.isThumbNav) {
        this.$parent.itemClicked(this._uid);
      }
    }
  },
  mounted() {
    if (!this.$isServer) {
      this.$el.addEventListener("dragstart", e => e.preventDefault());
    }
    this.$refs.multiSlide.innerHTML = this.slide.innerHTML;
  },
  props: {
    slide: {
      type: Object
    }
  }
};
</script>

<style>
.VueMLCarousel-slide {
  flex-basis: inherit;
  flex-grow: 0;
  flex-shrink: 0;
  user-select: none;
  backface-visibility: hidden;
  -webkit-touch-callout: none;
}
</style>
