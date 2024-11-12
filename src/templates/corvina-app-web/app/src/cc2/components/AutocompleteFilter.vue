<template>
	<div class="autocomplete-filter" style="width: 100%;">
		<v-combobox v-if="combobox"
			ref="autocomplete"
			class="search"	
			:menu-props="{ 'contentClass': `autocomplete-menu-${type}` }"
			data-qa="autocomplete-text-field"
			:loading="loading || parentLoading"
			:items="items"
			:search-input.sync="search"
			v-model="select"
			:item-title="'name'"
			item-value="id"
			text
			:autofocus="autofocus"
			:solo="solo"
			:placeholder="placeholder"
			:label="label"
			clearable
			:rules="rules"
			:required="required"
			no-filter
			@change="setItem"
			@input="handleInputEvent"
			@focus="openSelect"
			:hide-details="hideDetails"
			:hide-no-data="hideNoData"
			:return-object="returnObject"
			:item-disabled="v => functionDisable(v)"
			@click:clear="closeAndDelete"
			@keyup.esc="autocompleteClose"
			@blur="closeAndDelete"
			:disabled="disabled"
			clear-icon="ecc-M-Chiudi"
			append-icon="">
		</v-combobox>

    <v-autocomplete v-else
		ref="autocomplete"
		class="search"	
		data-qa="autocomplete-text-field"
		:menu-props="{ 'contentClass': `autocomplete-menu-${type}` }"
		:loading="loading || parentLoading"
		:items="items"
		v-model="select"
		v-model:search="search"
		:item-title="searchText"
		item-value="id"
		text
		:autofocus="autofocus"
		:solo="solo"
		:placeholder="placeholder"
		:label="label"
		clearable
		:rules="rules"
		:required="required"
		no-filter
		@change="setItem"
		@input="handleInputEvent"
		@focus="openSelect"
		:hide-details="hideDetails"
		:hide-no-data="hideNoData"
		:return-object="returnObject"
		:item-disabled="v => functionDisable(v)"
		@click:clear="closeAndDelete"
		@keyup.esc="autocompleteClose"
    	@keyup="keyUp"
		@blur="closeAndDelete"
		:disabled="disabled"
		clear-icon="ecc-M-Chiudi"
		append-icon=""
    	:prefix="prefix"
    	open-on-clear
    >
		<v-list-item v-if="search && addNewData" slot="prepend-item" class="grey--text">
			<!-- TODO remove this --><p> {{ search }} does not exists. <br /> <a @click="addNewValue(search)"> Create a new</a> one! </p>
			<!-- TODO to integrate later <p> {{i18n.t("autocompleteFilter.searchDoesNotExists",{search:search})}} <br /> <a @click="addNewValue(search)"> {{i18n.t("autocompleteFilter.createANewOne")}} </a></p>-->
		</v-list-item>
      	<template v-slot:item="data" v-if="$slots.item">
			<!-- AC {{Object.keys(data)}} -->
			<slot name="item" v-bind:data="data"></slot>
      	</template>
      <template v-slot:prepend-inner v-if="$slots['prepend-inner']">
        <slot name="prepend-inner"></slot>
      </template>
		</v-autocomplete>
	</div>
</template>

<script lang="ts">
//import { i18n } from '../main'; TODO to integrate later

import { PropType } from 'vue'
export default{
	name: 'AutocompleteFilter',
	data () {
    return {
		//i18n,
      	loading: false,
      	search: null,
      	select: null,
      	filterTimeout: undefined,
      	lastValidBackspaceTime: undefined,
		wrapperObject: undefined
    }
	},
	props: {
		placeholder: {
			type: String
		},
		label: {
			type: String
		},
		items: {
			type: Array
		},
		rules: {
			type: Array,
			default: () => [],
		},
		required: {
			type: Boolean,
			default: true
		},
		solo: {
			type: Boolean,
			default: false,
		},
		hideDetails: {
			type: Boolean,
			default: false,
		},
		hideNoData: {
			type: Boolean,
			default: false
		},
		returnObject: {
		type: Boolean,
		default: false
		},
		autofocus: {
		type: Boolean,
		default: false,
		},
		searchText: {
		type: String,
		default: 'name'
		},
		functionDisable: {
			type: Function,
			default: () => false,
		},
		addNewData: {
			type: Boolean,
			default: false
		},
		combobox: {
			type: Boolean,
			default: false
		},
		initialValue: {
			type: [Number , String, Object] as PropType<number|string|any>
		},
		appendIcon: {
			type: String,
			default: '$vuetify.icons.dropdown'
		},
		type: {
			type: String
    	},
		readonly: {
		type: Boolean,
		default: () => false
			},
			disabled: {
				type: Boolean,
				default: () => false
		},
		prefix: {
		type: String,
		default: ''
		},
		allowBack: { // if true we add a "soft-close" event
		type: Boolean,
		default: false
		},
		parentLoading: {
		type: Boolean,
		default: false
		},
		resetOnSelect: {
		type: Boolean,
		default: false
		}
	},
	watch: {
		search (val) {  
			if(val === null || val === undefined) {
				val = ''
			}
			let checkVal
			// if object we must compare the object property
			if(this.select && typeof this.select === 'object') {
				checkVal = this.select[this.searchText]
			} else {
				checkVal = this.select
			}
					if(val !== checkVal) {
				this.querySelections(val);
			}
		},
		initialValue() {
			this.select = this.initialValue;
		}
	},
	methods: {
		keyUp($event){
		// keyUp is late with respect to search:
		// require a double backspace within a time interval to trigger
		// otherwise false positives occur
		const maxGapForTrigger = 500;
		if((this.search == '' || this.search == null) && $event.code ==  'Backspace') {
			if(this.lastValidBackspaceTime == undefined) {
			this.lastValidBackspaceTime = Date.now();
			} else {
			const now = Date.now();
			const gap = now - this.lastValidBackspaceTime;
			if(gap < maxGapForTrigger) {
				this.lastValidBackspaceTime = undefined; // require 2 for next trigger
				this.autocompleteClose();
			} else {
				this.lastValidBackspaceTime = now;
			}
			}
		}
		},
		clear() {
		// this.$refs.autocomplete.value = null;
		(this.$refs.autocomplete as any).search = null;
		},
		autocompleteClose($event ?: any) {
			if(this.allowBack) {
				this.$emit('backEvent')
			} else {
				this.$emit('closeEvent');
			}
		},
		closeAndDelete() {
			if((this.$refs.autocomplete as any).isMenuActive){
				// required to avoid strange side effect by v-autocomplete when clicking on the clear icon (X)
				this.$nextTick(() => { 
				this.$emit('closeEvent');
				})
			}
		},
		openSelect() {
			(this.$refs.autocomplete as any).isMenuActive = true
		},
		handleInputEvent($event) {
			this.$emit('inputEvent');
		},
		querySelections (v) {
			this.loading = true
			if(this.filterTimeout) {
				clearInterval(this.filterTimeout);
			}
			this.filterTimeout = setTimeout(() => {
				this.$emit('searchItems', v);
				this.loading = false;
				}, 200);
			},
		setItem(value) {
			if(value) {
			this.$emit('setValue', value, this.wrapperObject);
			}
			if(this.resetOnSelect){
				(this.$refs.autocomplete as any).reset();
			}
		},
		addNewValue(item) {
			this.$emit('addNewValue', item);
		},
	},
	mounted() {
		this.select = this.initialValue;
	}
}
</script>

<style>

</style>
