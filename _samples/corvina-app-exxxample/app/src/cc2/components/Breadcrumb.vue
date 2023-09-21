<template>
  <div>
    <!-- DEBUG
    <div>searchOnEnter {{ searchOnEnter }}</div>
    <div>allowsSearchBar {{ allowsSearchBar }}</div>
    <div>disableSearch {{ disableSearch }}</div>
    <div>isTagSelected {{ isTagSelected }}</div>
    <div>searchTitle {{ searchTitle }}</div>
    <div>searchModel {{ searchModel }}</div>
    <div>searchKey {{ searchKey }}</div>
    <div>searchValue {{ searchValue }}</div>
    <div>currentTab {{ currentTab }}</div>
    <div>sortQueryKeys {{ sortQueryKeys }}</div>
    <div>sortModel {{ sortModel }}</div>
    <div>sortValue {{ sortValue }}</div>
    <div class="my-4">--------------------------------</div>
    DEBUG  -->
    <v-layout class="secondaryTopbar justify-space-between bg-g1 flex-wrap">
      <!-- breadcrumb -->
      <v-layout data-qa="breadcrumb" class="align-center px-4 py-2">
        <v-icon style="margin-right:16px">{{ icon }}</v-icon>
        <div v-bind:data-qa="'breadcrumb-path-' + (typeof p === 'string' ? p : p.text)" v-for="(p, index) in path" :key="'breadcrumb-path-' + index" d-inline
          class="mr-3">
          <span v-if="index > 0" class="mr-3">></span>
          <span v-if="typeof p === 'string'">{{ p }}</span>
          <a v-else-if="p.text" href="javascript:void(0);" @click="p.onClick">
            {{ p.text }}
          </a>
        </div>
      </v-layout>
      <slot></slot>
      <!-- sort dropdown -->
      <div v-if="!disableSort" class="breadcrumb-element d-flex ">
        <v-divider vertical :thickness="1"></v-divider>
        <div class="sort-dropdown xs-flex-grow " data-qa="sort-dropdown">
          <v-select class="corvina-select no-underline" :class="[{ backgroundHighlight: needHighlightSortBy }]"
            ref="sortDropdown" style="font-size: 12px!important" item-title="text" item-value="value" v-model="sortValue"
            @update:modelValue="sortSelect" menu-icon="ecc-M-Freccia" :items="sortingValues" :label="sortBy"
            :single-line="true" density="compact" variant="filled" />
        </div>
        <v-divider vertical :thickness="1"></v-divider>
        <v-layout :class="[{ backgroundHighlight: needHighlightSortBy }]" class="mx-2">
          <v-btn data-qa="sort-btn" class="sort-dropdown-button" :disabled="sortValue == sortBy" icon="ecc-TB-Sort"
            @click="reverseSort()" :class="[{ backgroundHighlight: needHighlightSortBy }, { rotate180: !sortAsc }]"
            variant="outlined" />
        </v-layout>
      </div>
      <v-layout class="breadcrumb-element"
        :class="{ backgroundHighlight: isSearching == true && !isTagSelected == true, 'bg-white': !(isSearching == true && !isTagSelected == true) }"
        v-if="tagEnabled || !disableSearch">
        <v-divider :thickness="2" vertical></v-divider>
        <Searchbar v-if="allowsSearchBar && !disableSearch && !isTagSelected" :searchTitle="searchTitle"
          :searchModel="searchModel" :confirmEnabled="searchOnEnter" :clearOnConfirm="false" :iconEnabled="false"
          @onInputChange="filter($event)" @confirm="searchEnter" />
        <animated-button v-if="allowsSearchBar && !disableSearch && !isTagSelected && searchOnEnter" @click="searchEnter"
          icon="ecc-TB-Enter" class="filterEnterChip">
        </animated-button>
        <div v-if="tagEnabled && isTagSelected" class="sort-dropdown bg-g1" style="width:13em">
          <v-select class="dropdown no-underline" style="font-size: 12px;" :label="'breadcrumb.filterBy'"
            ref="filterDropdown" append-icon="ecc-M-Freccia" :items="filterByItems" :return-object="true"
            @input="changeFilterBy" />
        </div>
        <div v-if="tagEnabled && isTagSelected" class="breadcrumb-divider"></div>
        <v-divider :thickness="2" vertical inset></v-divider>
        <!-- 
            TODO: filters
            <Searchbar
            v-if="tagEnabled && isTagSelected"
            :confirmEnabled="filterBySelected != undefined"
            :searchTitle="this.$i18n.t('breadcrumb.filterValue')"
            :iconEnabled="false"
            @input="filterModel = $event;"
            @confirm="validateChip"
            ref="filterSearchbar"
            :isAutocomplete="isAutocompleteMode"
            @autocomplete-search="execAutocompleteFunction"
            :autocompleteItems="autocompleteItems"
          /> -->
        <animated-button v-if="tagEnabled && isTagSelected && !isAutocompleteMode" @click="clickValidateChip"
          icon="ecc-TB-Enter" :disabled="!canEnterFilterChip" class="filterEnterChip">
        </animated-button>
        <!-- v-bind:class="{ 'mr-3': !tagEnabled }" -->
        <animated-button v-if="allowsSearchBar" icon="ecc-TB-Find" :isFilterActive="tagEnabled"
          :darkMode="isSearching && !isTagSelected" :value="!isTagSelected" v-bind:class="{ 'mr-3': !tagEnabled }"
          style="width: 22px; margin-left: 10px;" @click="toggleFilter('search')" />
        <!-- v-bind:class="{ disabled: tagEnabled }" -->
        <div style='position:relative;display:flex'>
          <animated-button v-if="tagEnabled" icon="ecc-TB-Filter" :value="isTagSelected"
            :darkMode="isSearching && !isTagSelected" class="mr-3"
            v-bind:class="{ 'mr-3': tagEnabled, 'ml-3': !allowsSearchBar }" style="width: 22px"
            @click="toggleFilter('filter')" />
          <span class="icon-number" v-if="isTagSelected">{{
            tagNumber
          }}</span>
        </div>
      </v-layout>
      <!-- </v-layout> -->
    </v-layout>
    <!-- TMP REMOVED
    <v-layout
      v-if="showTagBar"
      justify-end
      align-center
      style="width:100%; height: 40px; overflow:hidden;"
    >
      <div v-if="tagEnabled && isTagSelected">
        <v-chip
          class="ecc highlight-chip"
          style="margin:4px;height:25px;"
          v-for="item in currentFilters"
          v-bind:key="item.value"
        >
          {{ item.value }}
          <v-btn
            data-qa="remove-chip-button"
            text
            icon
            class="close"
            @click="removeAlarmFilter(item)"
            >✕</v-btn>
        </v-chip>
      </div>
      <v-chip
          class="ecc"
          style="margin:4px;height:25px;padding:0px;margin-right:30px"
          v-if="tagNumber != 0 && tagEnabled && isTagSelected"
        >
        <v-btn class="btnRemoveAll" @click="removeAllFilters()" text icon>
          ✕
        </v-btn>
      </v-chip>
    </v-layout>
  -->
  </div>
</template>

<script lang="ts">

import Searchbar from "./UIComponents/Searchbar.vue";
import AnimatedButton from "./UIComponents/AnimatedButton.vue";
import BreadcrumbFilterableMixin from "../mixins/breadcrumbFilterable";
import { defineComponent } from "vue";

export enum BREADCRUMB_FILTER_BY_ENUM {
  FREE_TEXT = "0",
  AUTOCOMPLETE = "1"
}

export default defineComponent({
  name: "Breadcrumb",
  props: {
    /**
     * Enables or disables the tag search input model.
     */
    showTagBar: {
      type: Boolean,
      default: true
    },
    tagEnabled: {
      type: Boolean,
      default: false
    },
    tagDefault: {
      type: Boolean,
      default: false
    },
    path: {
      type: Array<string | { text: string; onClick: Function }>,
      default: ["", ""]
    },
    icon: {
      type: String,
      default: ""
    },
    searchTitle: {
      type: String,
      default: "Search..."
    },
    searchModel: {
      type: String,
      default: ""
    },
    allowsSearchBar: {
      type: Boolean,
      default: true
    },
    searchOnEnter: { // if true update query only on enter
      type: Boolean,
      default: false
    },
    /**
     * Holds the current value of the sorting model in a dictionary with
     * currentTab as key.
     * Example:
     *  { 'devices': $route.query.sortDevicesBy }
     */
    sortModel: {
      type: Object,
      default: function () {
        return {};
      }
    },
    /**
     * Dictionary of which url query parameters should be edited
     * when user selects something. Uses currentTab as key.
     * Example:
     * { 'users': 'sortUserBy', 'groups': 'sortGroupBy', 'roles': 'sortRoleBy' }
     * yields
     * /#/permission?sortUserBy=something&sortGroupBy=somethingelse&sortRoleBy=test
     *
     * Important: Pages are expected to react to changes of their sortQueryKey with watch
     * or computed properties.
     */
    sortQueryKeys: {
      type: Object,
      default: function () {
        return {};
      }
    },
    /**
     * Dictionary of key/value to display in the main sort overflow-btn.
     * These values are used in conjunction of sortQueryKeys to build the query string.
     * Uses currentTab as key.
     * Example:
     *  'devices': {
     *     name: 'Name',
     *     creationDate: 'Creation date',
     *     connected: 'Status',
     *   }
     */
    sortingKeys: {
      type: Object,
      default: function () {
        return {};
      }
    },
    disableSearch: {
      type: Boolean,
      default: false
    },
    disableSort: {
      type: Boolean,
      default: false
    },
    /**
     * On a single tab page this can be whatever the user wants.
     * On a multiple tab page it should be linked to the route name.
     * Functions as a key to every other dictionary (sorting and searching).
     */
    currentTab: {
      type: String,
      default: ""
    },
    searchKey: {
      type: String,
      default: "search"
    },
    filterByItems: {
      type: Array,
      default: function () {
        return [];
      }
    },
    filterPrefixes: {
      type: Object,
      default: function () {
        return {};
      }
    },
    autocompleteItems: {
      type: Array,
      default: () => []
    },
    enableSortByHighlighting: {
      type: Boolean,
      default: false
    },
  },

  data: function () {
    return {
      sortAsc: true,
      sortValue: "",
      currentFilters: [],
      filterBySelected: null,
      filterByMode: BREADCRUMB_FILTER_BY_ENUM.FREE_TEXT,
      currentAutocompleteFunction: undefined,
      filterModel: '',
      searchValue: "",
      filterValue: '',
      BREADCRUMB_FILTER_BY_ENUM: BREADCRUMB_FILTER_BY_ENUM,
    };
  },

  methods: {
    // mixin
    ...BreadcrumbFilterableMixin.methods,

    removeAllFilters() {
      let currentPrefix = this.filterPrefixes[this.currentTab];
      let filteredKeys = this.currentFilters.map(m => currentPrefix + m.data.key).filter((val, index, arr) => arr.indexOf(val) === index);
      let newQuery = JSON.parse(JSON.stringify(this.$route.query));
      filteredKeys.forEach(m => {
        delete newQuery[m];
      });
      this.$router.replace({
        query: newQuery
      });
    },

    removeAlarmFilter(item) {
      if (!item || !item.data) {
        console.error(item);
        return;
      }
      let newQuery = {};
      let currentPrefix = this.filterPrefixes[this.currentTab];
      Object.keys(this.$route.query).forEach(key => {
        if (key == currentPrefix + item.data.key) {
          //if it's an array we should copy all values without the one in item
          if (Array.isArray(this.$route.query[key])) {
            let newQueryValue = new Array();
            for (let k = 0; k < this.$route.query[key].length; k++) {
              if (this.$route.query[key][k] != item.data.value) {
                newQueryValue.push(this.$route.query[key][k]);
              }
            }
            newQuery[key] = newQueryValue;
          } else {
            //simply do nothing
          }
        } else {
          newQuery[key] = this.$route.query[key];
        }
      });
      this.$router.replace({
        query: newQuery
      });
    },

    changeFilterBy(event: any) {
      this.filterBySelected = event.value;
      this.filterByMode = event.type;
      this.currentAutocompleteFunction = event.searchFunction;
      if (this.currentAutocompleteFunction != undefined) {
        this.currentAutocompleteFunction();
      }
    },

    clickValidateChip() {
      this.validateChip(this.filterModel);
    },

    validateChip(event) {
      if (this.filterBySelected != null && this.filterBySelected != undefined && event != "") {
        this.filterValue = "";
        this.filterModel = "";
        (this.$refs.filterSearchbar as InstanceType<typeof Searchbar>).clear();
        let currentPrefix = this.filterPrefixes[this.currentTab];
        // build query parameters array

        let queryParams = new Array();
        if (this.$route.query[currentPrefix + this.filterBySelected] != null) {
          if (Array.isArray(this.$route.query[currentPrefix + this.filterBySelected])) {
            if ((this.$route.query[currentPrefix + this.filterBySelected] as string[]).filter(m => m == event).length > 0) {
              //duplicated chip, ignore it
              return;
            }
          } else {
            if (this.$route.query[currentPrefix + this.filterBySelected] == event) {
              //duplicated chip, ignore it
              return;
            }
          }
          queryParams = [
            ...this.$route.query[currentPrefix + this.filterBySelected],
            event
          ];
        } else {
          queryParams = [event];
        }
        this.$router.replace({
          query: {
            ...this.$route.query,
            [currentPrefix + this.filterBySelected]: queryParams
          }
        });
      } else {

      }
    },

    searchEnter() {
      if (this.searchOnEnter) {
        this.$router.replace({
          query: {
            ...this.$route.query,
            [this.searchKey]: this.searchValue
          }
        });
      }
    },

    filter(value) {
      if (this.searchOnEnter) {
        this.searchValue = value
      } else {
        this.$router.replace({
          query: {
            ...this.$route.query,
            [this.searchKey]: value
          }
        });
      }
    },

    sort($event) {
      this.$router.replace({
        query: {
          ...this.$route.query,
          [this.sortQueryKeys[this.currentTab]]: $event
        }
      });
    },

    toggleFilter(tagOrSearch) {
      this.filterBySelected = undefined
      this.filterModel = ""
      this.$router.replace({
        query: {
          ...this.$route.query,
          filterEnabled: tagOrSearch == 'filter' ? "true" : "false"
        }
      })
    },

    reverseSort() {
      this.sortAsc = !this.sortAsc;
      this.sortSelect(this.sortValue);
    },

    sortSelect($event) {
      this.sortValue = $event;

      (this.$refs.sortDropdown as any).isFocused = false;
      (this.$refs.sortDropdown as any).isMenuActive = false;
      this.sort($event + (this.sortAsc ? "Asc" : "Desc"));
    },

    parseSort() {
      const val = this.sortModel;
      if (!val || !this.currentTab) {
        console.error("invalid parse sort", val, this.currentTab);
      }
      if (val[this.currentTab] != undefined) {
        this.sortValue = val[this.currentTab]
          .replace("Asc", "")
          .replace("Desc", "");
        this.sortAsc = val[this.currentTab].indexOf("Asc") > 0 ? true : false;
      } else {
        // this reset sortValue if the current value is undefined and we don0t work with route e.g. dashboard case.
        this.sortValue = this.sortBy
      }
    },

    parseFilterEnabled() {
      // TODO: filterEnabled should be tab aware
      if (this.tagEnabled) {
        this.toggleFilter(this.isTagSelected ? 'filter' : 'search')
      }
    },

    setChips(data) {
      this.currentFilters = [];
      if (data == undefined) return;
      data.forEach(item => {
        this.currentFilters.push({
          value: item.value,
          data: item.data
        });
      });
    },

    checkChips(query) {
      const filters = this.parseQueryFilters(query, this.filterPrefixes[this.currentTab], this.filterByItems)
      this.setChips(filters);
    },
    parseQuery(val) {
      if (!val) return;
      this.checkChips(val)
    }
  },

  mounted() {
    if (!this.disableSort) {
      this.parseSort(this.sortModel);
    }
    this.parseQuery(this.$route.query);
    this.parseFilterEnabled();
  },

  watch: {
    '$route.query': function (val) {
      this.parseQuery(val);
    },
    sortModel: function () {
      this.parseSort();
    },
    currentTab() {
      this.parseSort();
    }
  },
  computed: {
    isSearching(): boolean {
      return this.searchModel != '';
    },
    sortBy(): any /** FIXME: fix this any */ {
      return 'Sort by:'
    },
    canEnterFilterChip(): boolean {
      return (this.filterBySelected && this.filterModel) ? true : false
    },
    tagNumber(): number {
      return this.currentFilters.length;
    },
    sortingValues(): any {
      console.log('sortingValues', this.sortingKeys, this.currentTab)

      return this.sortingKeys && Object.keys(this.sortingKeys[this.currentTab]).map(sk => ({
        text: this.sortingKeys[this.currentTab][sk],
        value: sk
      })) || [];
      // if(this.$store.getters['sorting/getSortingValues'](this.currentTab)) {
      //   return Object.keys(this.$store.getters['sorting/getSortingValues'](this.currentTab)).map(sk => ({
      //     text: this.$store.getters['sorting/getSortingValues'](this.currentTab)[sk],
      //     value: sk
      //   }));
      // }
      // return Object.keys(this.sortingKeys[this.currentTab]).map(sk => ({
      //   text: this.sortingKeys[this.currentTab][sk],
      //   value: sk
      // }));
    },
    // TODO: filterEnabled should be tab aware
    isTagSelected(): boolean {
      if (this.$route.query.filterEnabled === undefined) {
        return this.tagDefault;
      }
      const b = this.$route.query.filterEnabled ? (this.$route.query.filterEnabled === 'true') : false;
      return b
    },
    isAutocompleteMode(): boolean {
      return this.filterByMode == BREADCRUMB_FILTER_BY_ENUM.AUTOCOMPLETE ? true : false;
    },
    // TODO: filters
    // execAutocompleteFunction():Function{
    //   if(this.currentAutocompleteFunction!=undefined){
    //     return this.currentAutocompleteFunction;
    //   }
    //   return ()=>{};
    // },
    needHighlightSortBy(): any {
      return this.enableSortByHighlighting && this.$route.query?.[this.sortQueryKeys[this.currentTab]] ? true : false;
    }
  },
  components: {
    Searchbar,
    AnimatedButton
  }
});
</script>

<style scoped>
/* looks like this is a necessary evil, otherwise its children won't obey the "fill-height" class */
/*.secondaryTopbar {
   height: 40px; 
}*/

.secondaryTopbar .searchbar {
  width: 336px;
}

.secondaryTopbar .sort-dropdown {
  outline: none;
  width: 17em;
}

.secondaryTopbar .primary--text {
  color: var(--color-highlight) !important;
}

.breadcrumb-element {
  height: 40px;
  min-width: 200px;
}
</style>

<style scoped>
.icon-number {
  position: absolute;
  right: 8px;
  bottom: 6px;
  width: 12px;
  height: 12px;
  color: var(--color-wt);
  background-color: var(--color-highlight);
  border-radius: 8px;
  font-size: 9px;
  line-height: 12px;
  text-align: center;
}

.btnRemoveAll {
  margin: 0px;
  width: 25px;
  height: 25px;
}

.filterEnterChip.animatedButton:not([disabled])>>>.v-icon {
  color: var(--color-dk);
}

.sort-dropdown>>>.v-date-range .layout {
  border: 0 !important;
}

.sort-dropdown>>>.v-autocomplete.v-select.v-input--is-focused input {
  min-width: 0px;
}

/*vuetify 3 style*/
:deep(.corvina-select.v-input.v-select) {
  height: 40px;
  margin-bottom: 0px;
}

:deep(.corvina-select.v-input.v-select .v-label) {
  font-size: 12px;
  height: 100%;
  top: 0;
  opacity: 1;
}

:deep(.corvina-select .v-list-item-title) {
  font-size: 12px;
}

:deep(.corvina-select.v-input.v-select .v-field) {
  border-radius: 0px;
  background: inherit;
}

:deep(.corvina-select.v-input.v-select .v-field .v-field__append-inner > .v-icon) {
  opacity: 1;
}

:deep(.corvina-select.v-select .v-field--single-line .v-select__selection-text) {
  padding-top: 4px;
  color: rgba(var(--v-theme-on-background), var(--v-high-emphasis-opacity));
}

:deep(.corvina-select.v-select.no-underline .v-field--variant-filled .v-field__outline::before) {
  display: none;
}

:deep(.corvina-select.v-select.no-underline .v-field--variant-filled .v-field__overlay) {
  background-color: inherit;
}

:deep(.corvina-select.v-select.no-underline .v-field--variant-filled .v-field__outline) {
  display: none;
}

.sorticon {
  border: 1px solid var(--color-g4);
  border-radius: 3px;
}

.sort-dropdown-button {
  border-radius: 0px;
  width: auto;
  height: auto;
  vertical-align: middle;
  width: 22px;
  height: 22px;
  margin: auto;
}
</style>
