<template>
  <v-layout searchbar class="flex-row fill-height justify-end align-center px-4 no-x-margin bg-white" :class="[background,{backgroundHighlight:(searchModel !=''&& searchModel!=undefined)}]" >
    <AutocompleteFilter
      v-if="isAutocomplete"
      :placeholder="searchTitle"
      :items="autocompleteItems"
      :searchText="'label'"
      :return-object="true"
      :hide-no-data="true"
      :resetOnSelect="true"
      type="searchbar"
      @searchItems="searchItems"
      @setValue="setValueAutoComplete"
      ref="autocomplete"
    />
    <input
      class="searchbar-input-search pl-4"
      :class="{searchingTextColor:searchModel!= '' &&searchModel!=undefined &&!isFilterActive,caretDefault:searchModel==''|| searchModel==undefined}"
      data-qa="input-search"
      :value="searchModel"
      type="text"
      v-bind:placeholder="searchTitle" 
      @input="$emit('onInputChange',($event.target as HTMLTextAreaElement).value)"
      @keyup.13="emitConfirm"
      ref="input"
    />
    <v-icon v-if="iconEnabled" :color="(searchModel !=''&& searchModel!=undefined) ? 'var(--color-wt)': 'var(--col-highlight)'" >{{icon}}</v-icon>
  </v-layout>
</template>
<style scoped>
  .searchbar input {
    outline: none;
    /* width: 100%; */
    flex-grow: 1;
  }
  .backgroundHighlight{
    background-color: var(--color-highlight) !important;
  }
  .backgroundColor{
    background-color: var(--background);
  }
  .caretDefault{
    caret-color: var(--color-dk);
  }
  .searchingTextColor{
    color: var(--color-wt);
    caret-color: var(--color-wt);
  }
  .searchbar .v-icon::before {
     font-size: 22px; 
  }

  .autocomplete-filter >>> .v-input.search{
    padding: 0px !important;
    font-size: 12px;
  }
  .searchbar-input-search{
    width: 100%;
    outline: none;
  }
</style>
<script lang="ts">

  import AutocompleteFilter from "../AutocompleteFilter.vue";
  import Vue from 'vue'
  export default({
    name: 'Searchbar',
    components: {
      AutocompleteFilter
    },
    data() {
      return {
        model: '',
        search:'',
      }
    },
    methods: {
      emitConfirm(event) {
        if(this.confirmEnabled) {
          this.$emit('confirm', event.target.value);
          if(this.clearOnConfirm) {
            event.target.value = '';
          }
        }
      },
      clear() {
        if(this.$refs.input){
          (this.$refs.input as HTMLInputElement).value = "";
        }
      },
      searchItems(s:string){
        this.$emit('autocomplete-search',s)
      },
      setValue(value) {
        this.$emit('input', value.label);
        if(this.confirmEnabled) {
          this.$emit('confirm', value.label);
          if(this.clearOnConfirm) {
            value.label = '';
          }
        }
      },
      setValueAutoComplete(value){
        this.$emit('input', value.label);
        if(this.confirmEnabled) {
          this.$emit('confirm', value.label);
        }

      }
    },
    props: {
      background: {
        type: String,
        default: 'bg-g1'
      },
      confirmEnabled: {
        type: Boolean,
        default: false
      },
      clearOnConfirm: {
        type: Boolean,
        default: true
      },
      icon: {
        type: String,
        default: 'ecc-TB-Find'
      },
      iconEnabled: {
        type: Boolean,
        default: true
      },
      searchTitle: {
        type: String,
        default: 'Search...'
      },
      searchModel: {
        type: String,
      },
      isFilterActive:{
        type: Boolean,
        default:false
      },
      isAutocomplete:{
        type: Boolean,
        default:false
      },
      autocompleteItems:{
        type: Array,
        default: ()=>[]
      },
    }
  })
</script>
