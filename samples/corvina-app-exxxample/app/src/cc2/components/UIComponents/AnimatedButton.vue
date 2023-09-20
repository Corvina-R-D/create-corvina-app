<template>
  <div v-if="tooltip != '' || (shrink && label)">
    <v-tooltip bottom flex >
      <template v-slot:activator="{ props }" >
        <div v-bind="props" class="fill-height animated-button-tooltip-activator-wrapper">
          <button
            :disabled="disabled"
            :data-qa="dataQa"
            :class="{
              animatedButton: true,
              'd-flex': true,
              'align-items-center': true,
              active: isActive,
              dangerHighlight: danger
            }"

            @click.stop="click"
          >
            <v-icon class="ecc" v-if="!activeIcon || !value">{{ icon }}</v-icon>
            <v-icon class="ecc" v-if="isToggle && activeIcon && value">{{ activeIcon }}</v-icon>
            <span v-if="label" class="label ml-2" v-bind:class="{'d-none': shrink, 'd-lg-block': shrink }">{{ label }}</span>
            <div v-else-if="$slots.default" class="label ml-2" v-bind:class="{'d-none': shrink, 'd-lg-block': shrink }">
              <slot></slot>
            </div>
          </button>
        </div>
      </template>
      <span>{{tooltip || label}}</span>
    </v-tooltip>
  </div>
  <button
    v-else
    :disabled="disabled"
    :data-qa="dataQa"
    :class="{
      animatedButton: true,
      'd-flex': true,
      'align-items-center': true,
      active: isActive,
      dangerHighlight: danger
    }"
    @click="click"
  >
    <v-icon v-if="!activeIcon || !value" :class="{icondarkModeColorWt:darkMode}" >{{ icon }}</v-icon>
    <v-icon v-if="isToggle && activeIcon && value">{{ activeIcon }}</v-icon>
    <span v-if="label" class="label ml-2" v-bind:class="{'d-none': shrink, 'd-lg-block': shrink }">{{ label }}</span>
    <div v-else-if="$slots.default" class="label ml-2" v-bind:class="{'d-none': shrink, 'd-lg-block': shrink }">
      <slot></slot>
    </div>
  </button>
</template>
<style>
  .animatedButton .v-icon {
    color: var(--color-dk);
  }
  .animatedButton .label {
    color: var(--color-dk);
  }

  .animatedButton[disabled] .label,
  .animatedButton[disabled] .v-icon {
    color: var(--color-g4);
  }

  .animatedButton.active:not([disabled]) .v-icon,
  .animatedButton:hover:not([disabled]) .v-icon {
    color: var(--color-highlight);
  }

  .animatedButton:hover:not([disabled]) .v-icon.icondarkModeColorWt,
  .animatedButton.active .v-icon.icondarkModeColorWt {
    color: var(--color-wt) !important;
  }

  .dangerHighlight:hover:not([disabled]) .v-icon {
    color: var(--color-alert) !important;
  }

  .animatedButton div.label {
    display: inline-block;
  }

  .animated-button-tooltip-activator-wrapper {
    display: flex;
    align-items: center;
  }

</style>

<script lang="ts">
export default {
  name: 'AnimatedButton',
  props: {
    icon: {
      type: String,
      default: "ecc-T-Add"
    },
    activeIcon: {
      type: String,
      default: ""
    },
    dataQa:{
      type: String,
      default: ""
    },
    label: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    },
    isToggle: {
      type: Boolean,
      default: false
    },
    value: {
      type: Boolean,
      default: undefined
    },
    shrink: {
      type: Boolean,
      default: false
    },
    danger:{
      type: Boolean,
      default: false
    },
    tooltip: {
      type: String,
      default: ""
    },
    darkMode:{
      type:Boolean,
      default: false
    },
  },

  computed: {
    isActive() : boolean {
      return this.value !== undefined ? this.value : this.active;
    },

  },

  data() {
    return {
      active: this.value || false
    };
  },

  methods: {
    click($event) {
      // $event.preventDefault();
      // $event.stopPropagation();
      this.$emit("click", $event);
      if (this.isToggle) {
        this.active = this.value !== undefined ? !this.value : !this.active;
        this.$emit("changed", this.active);
      }
    }
  }
}
</script>
