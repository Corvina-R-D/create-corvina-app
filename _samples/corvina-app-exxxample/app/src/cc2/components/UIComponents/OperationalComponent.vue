<template>
<div :class=" (disabled ? 'disabled ' : '') + ' operational custom-scrollbars shadow-editMenu' ">
  <v-layout class="flex-column h-100">
    <v-toolbar fixed class="padded bg-wt" style="box-shadow: none !important; z-index:10">
      <v-toolbar-title>
        <v-layout class="align-center">
          <v-img v-if="showIcon && iconIsValidUrl" :src="icon" width="50px" height="50px" style="margin-right:12px;" />
          <v-icon v-else-if="showIcon" style="font-size:50px; margin-right:12px;" :class="iconColor">{{ icon }}</v-icon>
          
          <div class="title">
            <div style="text-transform:capitalize; line-height: 18px;">{{ splitTitle[0] }}</div>
            <div :style="exactTitle ? '' : 'text-transform:capitalize'" :title="splitTitle[1]">{{ splitTitle[1] }}</div>
          </div>
        </v-layout>
      </v-toolbar-title>
      <div><!-- spacer --></div>
      <v-layout class="align-center actions flex-shrink-1 flex-grow-0">
        <slot name="additionalButtons"></slot>

        <v-btn
          icon
          v-if="openHelp && showHelp"
          @click.native="openHelp"
          :data-qa="`help-dialog-${type}`"
          class="helpButton"
        >
          <v-icon style="font-size:22px">ecc-T-Help</v-icon>
        </v-btn>
        <v-btn
          v-if="denyEnabled"
          :loading="closeLoading"
          icon
          @click.native="closeDialog"
          style="margin:0; height: 38px; width: 38px;"
          :data-qa="`close-dialog-${type}`"
          :class="{'bg-g2': closeLoading}"
          class="col-wt squareCorners"
        >
          <span v-if="closeLoading"></span>
          <v-icon v-else class="col-g2">{{ closeIcon }}</v-icon>
        </v-btn>
        <v-btn 
          v-if="acceptEnabled"
          :disabled="acceptDisabled"
          :loading="confirmLoading"
          icon
          @click.native="confirmDialog"
          :data-qa="`confirm-dialog-${type}`"
          :class="{'bg-highlight': confirmLoading}"
          class="col-wt squareCorners"
          style="height:38px; width: 38px;"
        >
          <span v-if="confirmLoading"></span>
          <v-icon v-else class="col-highlight">{{ confirmIcon }}</v-icon>
        </v-btn>
      </v-layout>
    </v-toolbar>
    <div class="slot-div" style="height: calc(100% - 110px); position: relative; top: 0px; overflow:auto; padding-left: 30px; padding-right: 30px;">
      <slot></slot>
    </div>
  </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

const isImageUrl = (str) => str && (str.startsWith('http') || str.startsWith('http') || str.startsWith('data:image'));

export default {
  name: 'OperationalComponent',
  data: () => ({
    iconIsValidUrl: false,
  }),
  props: {
    dialog: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // TODO: refactor to emit?
    closeDialog: {
      type: Function
    },
    // TODO: refactor to emit?
    openHelp: {
      type: Function
    },
    closeLoading: {
      type: Boolean,
      default: false
    },
    confirmLoading: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
    },
    exactTitle: {
      type: Boolean,
      default: false
    },
    /**
     * If the icon string is a valid url, it will be used as the icon using v-img
     */
    icon: {
      default: "ecc-E-Edit",
      type: String
    },
    iconColor: {
      default: "col-dk",
      type: String
    },
    acceptEnabled: {
      default: true,
      type: Boolean
    },
    acceptDisabled: {
      default: false,
      type: Boolean
    },
    denyEnabled: {
      default: true,
      type: Boolean
    },
    showIcon: {
      default: true,
      type: Boolean
    },
    showHelp: {
      default: true,
      type: Boolean
    },
    type: {
      type: String,
      default: ''
    },
    confirmIcon: {
      type: String,
      default: 'ecc-E-V'
    },
    closeIcon: {
      type: String,
      default: 'ecc-E-X'
    },
    collapsed: {
      type: Boolean,
      default: false
    }
  },

  mounted: function () {
    this.iconIsValidUrl = isImageUrl(this.icon);
  },

  methods: {
    // setTitle(newTitle){
    //   this.title = newTitle;
    // },

    confirmDialog() {
      this.$emit('confirmDialog');
    },
  },
  computed: {
    splitTitle() : string[] {
      if(this.title){
        let [head, ...tail] = this.title.split(' ').filter(s => s.length > 0);
        const tailStr = tail.join(' ');
        return [head, tailStr];
      } else {
        return ['',''];
      }
    },
  }
}

</script>

<style>

.operational {
  width: 100%;
  height: 100%;
}

.operational .padded {
  /* padding: 0 30px !important; */
  padding: 30px 30px 32px 30px !important;
}

.operational .ecc.composite {
  font-size:50px;
  width:37px;
  height:50px;
}

/* .operational .slot-div ::-webkit-scrollbar {
    width: 0px;
} */

.operational .v-toolbar__content {
  /* height: 10vh !important; */
  /* height: 110px !important; */
  padding: 0;
  height: 48px !important;
}

.operational .v-toolbar__title {
  height: 100%;
  display: flex;
  max-width: calc(100% - 80px);
}

.operational .title {
  color: var(--color-dk);
  opacity: 0.8;
  font-weight:  normal !important;
  overflow: hidden;
}
.operational .title div {
  text-overflow: ellipsis;
  overflow: hidden;
}

.operational .title > *:first-child {
  font-size: 14px;
}

.operational .title > *:nth-child(2) {
  font-size:18px;
  /*line-height:100%; 
  margin-top:3px; */
}

.operational.disabled, .operational.disabled .v-sheet, .operational.disabled .preset-properties {
  background: var(--color-g1) !important;
}

.operational .actions button {
  margin: 0;
  width: 38px;
}

.operational .actions .squareCorners {
  border-radius: 0;
}

.operational .actions button .v-icon {
  font-size: 38px;
}

.helpButton.v-btn .v-btn__content .v-icon {
  color: var(--color-g4);
  margin:0;
  height: 38px;
  transition:0ms
}
.helpButton.v-btn .v-btn__content .v-icon:hover{
  color: var(--color-highlight);
  transition:0ms
}
.csvExport.v-btn .v-btn__content .v-icon:hover{
  color: var(--color-highlight);
  transition:0ms
}
.sidepanel-collapsed .helpButton.v-btn {
  display: none;
}
.sidepanel-collapsed .slot-div {
  overflow: hidden !important;
}
</style>
