<template>
  <div class="VueCarousel-slide" v-on:click="emitClick">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "vueml-slide",
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
  }
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
