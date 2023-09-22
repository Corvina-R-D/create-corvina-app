<template>
  <!-- 
    TODO:
    - i18n
   -->
<div class="custom-scrollbars">
  <div v-if="needOverlay && isOpen" class="side-panel-overlay"></div>
	<aside v-if="!bottom" ref="sidePanelComponent" :class="{sidepanel: true, right: right, open: isOpen}" :style="{width: widthApplied, maxWidth: maxWidthApplied, zIndex}">
    <slot></slot>
	</aside>
  <aside v-if="help || bottom"
    class="sidePanelHelp"
    :class="{
      'help-panel-main-vertical': help,
      'sidepanelHelpRight': help,
      'sidepanelRight': right,
      'help-panel-main-horizontal': bottom,
      'sidepanelHelpDown': bottom,
      'right': right,
      'openHelp': isOpenHelp}"
    :style="helpStyle">
    <v-layout class="help-header align-center justify-space-between">
      <v-layout class="align-center">
        <v-icon>ecc-T-Help</v-icon><span data-qa="help-title" style="padding-left: 10px;">
          Need help?
          <!-- TODO: {{i18n.t("needHelp")}} -->
        </span>
      </v-layout>
      <v-layout class="help-close-button align-center justify-end"
        data-qa="close-help"
        @click="closeHelp()"
        @mouseover="closeHover = true"
        @mouseleave="closeHover = false"
        :class="{ 'help-close-button-hover': closeHover }">
        <!-- TODO: set correct icon once added to font -->
        <span style="padding-right: 10px">
          Close
          <!-- TODO: {{i18n.t("close")}} -->
        </span><v-icon>ecc-M-Chiudi</v-icon>
      </v-layout>
    </v-layout>
    <v-layout class="help-panel-content flex-column">
      <slot style="width:100%" name="help"></slot>
    </v-layout>
  </aside>
</div>
</template>

<style scoped>
  .sidepanel {
    position: fixed;
    top: 0;
    bottom: 0;
    transition: all 400ms;
    box-shadow: transparent 0 0 0;
  }

  .help-header {
    margin-bottom: 30px;
  }
  .help-header .v-icon {
    font-size: 22px;
    color: var(--color-g4);
  }
  .help-close-button{
    cursor: pointer;
    font-size: 12px;
    text-align: right;
    color: var(--color-dk);
  }
  .help-close-button .v-icon {
    font-size: 12px;
    color: var(--color-dk);
  }
  .help-close-button-hover, .help-close-button-hover .v-icon {
    color: var(--color-highlight);
    transition:0ms
  }

  .helpLogo{
    text-align-last: center;
    font-size: 12px;
  }
  .helpLogo .v-icon {
    font-size: 22px;
    color: var(--color-g4);
  }

  .help-panel-main-vertical {
  padding-top: 50px;
  padding-left: 30px;
  padding-right: 37px;  
  }
  .help-panel-main-horizontal {
    padding-top: 24px;
    padding-left: 60px;
    padding-right: 60px;    
  }

  .sidepanelHelpRight {
    display: none;
    overflow: auto;
    position: fixed;
    top: 0;
    bottom: 0;
    /* transition: all 400ms; */
    background-color: var(--color-wt);
    box-shadow: var(--shadow-editMenu);
    /* z-index: 199 !important;*/
    height: 100%;
  }
  .sidepanelHelpDown {
    display: none;
    overflow: auto;
    position: fixed;
    left: 0;
    bottom: 0;
    height: 263px;
    width: 100%;
    transition: all 400ms;
    background-color: var(--color-wt);
    box-shadow: var(--shadow-editMenu);
    z-index: 1 !important;
  }
  .openHelp{
    display: block;
  }
  .sidepanel:not(.open) * {
    box-shadow: transparent 0 0 0;
  }

  .sidepanel.right {
    right: -30px; /* shadow margin */
    transform: translateX(100%);
  }

  .sidepanel:not(.right) {
    left: 0;
    transform: translateX(-100%);
  }

  .sidepanelHelp.right {
    right: 0;
    /* transform: translateX(100%); */
  }

  .sidepanelHelp:not(.right) {
    left: 0;
    /* transform: translateX(-100%); */
  }

  .sidepanel.right.open,
  .sidepanel:not(.right).open {
    transform: translateX(calc(0% - 30px)); /* to compensate shadow margin */
    box-shadow: rgb(95, 94, 94) 5px 0px 5px -5px;
  }

  .sidepanel-collapsed .sidePanelHelp {
    display: none;
  }
  .side-panel-overlay{
    width: 100vw;
    height: 100vh;
    position: absolute;
    background-color: rgba(0,0,0,.5);
    z-index: 190;
    top: 0px;
    left: 0px;
    right: 0px;
    bottom: 0px;
  }
</style>

<script lang="ts">
	import Vue from 'vue'
  import AnimatedButton from './AnimatedButton.vue'
  // import { i18n } from '../../main' TODO:

	export default {
		props: {
      width: {
        type: Number,
        default: 340
      },
      maxWidth: {
        type: String,
        default: '75%'
      },
      widthPercent: { // percentual width
        type: Number,
        default: null
      },
      right: {
        type: Boolean,
        default: false
      },
      help: {
        type: Boolean,
        default: false
      },
      bottom: {
        type: Boolean,
        default: false
      },
      // isOpen: {
      //   type: Boolean,
      //   default: false
      // }
      zIndex: {
        type: Number,
        default: 1000
      },
      forcedRightPosition: {
        type: Number,
        default: null
      },
      helpRightWidth: {
        type: Number,
        default: 340
      },
      needOverlay: {
        type: Boolean,
        default: false
      }
    },
    components: {
      AnimatedButton,
    },

    data() {
      return {
        // i18n, TODO:
        isOpen: false,
        isOpenHelp: false,
        closeHover: false,
        shift:0,
      }
    },

    // attach and destroy sidepanels only as children of root element to get correct z-index sorting
    mounted: function(){
      this.$root.$el.append(this.$el);
      try {        
        this.shift = (this.$refs.sidePanelComponent as HTMLElement).clientWidth
        window.addEventListener('resize',this.panelPos)
      } catch (error) {
      }
    },

    destroyed: function() {
      this.$el && this.$el.parentNode && this.$el.parentNode.removeChild(this.$el);
      window.removeEventListener('resize',this.panelPos)
    },

    methods: {
      panelPos: function(){
        try {
          this.shift = (this.$refs.sidePanelComponent as HTMLElement).clientWidth
        } catch(error) {}
      },
      async open() {
        this.isOpen = true;
        return new Promise(resolve => {
          setTimeout(() => resolve(undefined), 400);
        })
      },

      async close() {
        this.isOpen = false;
        this.isOpenHelp = false;
        return new Promise(resolve => {
          setTimeout(() => resolve(undefined), 400);
        })
      },
      async openHelp() {
        this.isOpenHelp = true;
        return new Promise(resolve => {
          setTimeout(() => resolve(undefined), 400);
        })
      },
      async closeHelp() {
        this.isOpenHelp = false;
        return new Promise(resolve => {
          setTimeout(() => resolve(undefined), 400);
        })
      },
      async toggleHelp() {
        if( this.isOpenHelp) {
          return this.closeHelp()
        } else {
          // TODO: fixme in mobile-responsive review
          if (this.$vuetify.display.xs) {
            console.log("TODO: fixme in mobile-responsive review");
            return;
          }
          this.panelPos()
          return this.openHelp()
        }
      },
    },
    computed: {
      helpStyle() : any /** FIXME: fix this any */{
        if(this.right) {
          // TODO: fixme in mobile-responsive review
          if (this.$vuetify.display.xs) {
            this.closeHelp()
            return;
          }
          
          return {
            width: `${this.helpRightWidth}px`,
            right: this.forcedRightPosition ? this.forcedRightPosition+'px' : this.shift +'px',
            zIndex: this.zIndex-1
            }
        }
        if(this.bottom) {
          return {
            zIndex: 1
            }
        }
      },
      maxWidthApplied() : string {      
        return this.$vuetify.display.xsOnly ? '100%' : this.maxWidth;
      },
      widthApplied() : string {
        return this.$vuetify.display.xsOnly ? '100%' : '' + this.width + 'px';
      }
    }
	}
</script>

