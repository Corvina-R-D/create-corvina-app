<template>
  <div>
    <CorvinaBreadcrumb :icon="breadcrumb.icon" :path="breadcrumb.path" :showSearchBar="!breadcrumb.disableSearch"
      :searchPlaceholder="breadcrumb.searchTitle" :searchModel="search" @update:searchModel="search = $event" />
    <v-container fluid class="container maincontainer">
      <v-row>
        <v-spacer />
        <v-col>
          <div class="text-center">
            <h1 class="col-primary">{{ $t('list.congratulationsTitle') }}</h1>
            <h4 class="col-primary-dk2">{{ $t('list.congratulationsSubtitle') }}</h4>
          </div>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col>
          <p>
            {{ $t('list.runtimeInfoIntro') }}
            <br />
            <code>{{ runtimeInfo }}</code>
          </p>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col>
          <h3 class="text-center">{{ $t('list.examplesHeading') }}</h3>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col style="display: flex; justify-content: center; align-items: center; gap: 12px;">
          <CorvinaButton
            :text="$t('list.clickMeButton')"
            icon="ecc-M-Home"
            :tooltip="$t('list.clickMeTooltip')"
            :variant="CORVINA.BUTTON.VARIANT.OUTLINED"
            dataQa="example-button"
            @clicked="onExampleButtonClick"
          />
          <span>{{ $t('list.clickedTimes', { count: clickCount }) }}</span>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col style="display: flex; justify-content: center; align-items: center; gap: 12px;">
          <CorvinaIcon icon="ecc-E-Edit" :color="CORVINA.COLOR.PRIMARY" />
          <CorvinaSelect
            :items="selectItems"
            :model="selectedItem"
            :returnObject="true"
            :placeholder="$t('list.chooseOptionPlaceholder')"
            style="min-width: 200px;"
            @update:model="onSelectChange"
          />
          <span v-if="selectedItem">{{ $t('list.selectedLabel', { title: selectedItem.title }) }}</span>
        </v-col>
        <v-spacer />
      </v-row>
    </v-container>
    <v-container fluid class="container maincontainer">
      <HelpDrawer :id="HELP_DRAWER_ID">
        <div v-html="helpHtml" data-qa="help-content"></div>
      </HelpDrawer>
      <v-tabs class="main-tabs fill-height mt-5" v-model="activeTab" align-tabs="title">
        <v-tab style="text-transform: capitalize">
          {{ $t("entity") }}
        </v-tab>

        <v-layout class="additionalHeader align-center">
          <v-spacer></v-spacer>
          <CorvinaButton
            style="margin-left: 10px;"
            :variant="CORVINA.BUTTON.VARIANT.FREE"
            icon="ecc-T-Help"
            :tooltip="$t('help.show')"
            dataQa="help-button"
            @clicked="showHelp"
          />
        </v-layout>
      </v-tabs>

      <v-window disabled v-model="activeTab">
        <v-window-item>
          <div class="overflow-y-auto fill-height tabs-top-separator">
            <CorvinaTable
              class="main-table mt-5"
              id="main-table"
              :headers="reportHeaders"
              :items="filteredRepositories"
              :itemsPerPage="pageSize"
              :currentPage="page"
              :itemsLength="filteredRepositories.length"
              @currentPageChanged="currentPageChanged"
              @currentItemsPerPageChanged="currentItemsPerPageChanged"
              :isExpandable="false"
              data-qa="main-table"
            />
          </div>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useSecurity } from "../../stores/security";
import { CORVINA } from '@corvina/vue-components-library';
import HelpDrawer from "../../components/Help/HelpDrawer.vue";
import { store as HelpStore } from "../../components/Help/Help.store";
//@ts-ignore
import { pageHtml } from "BrandData";
import { getCurrentLocaleLang } from "../../i18n/i18n";

const HELP_DRAWER_ID = "PageBottomHelp";

export default defineComponent({
  name: "List",
  components: { HelpDrawer },
  data() {
    return {
      CORVINA,
      HELP_DRAWER_ID,
      helpHtml: "",
      clickCount: 0,
      selectedItem: null as { title: string; value: string } | null,
      security: null,
      pageSize: 10,
      page: 1,
      search: "",
      sizeAllKey: 0,
      activeTab: 0,
      repositories: [
        { name: "name1", version: 5, actions: "..." },
        { name: "name2", version: 92, actions: "..." },
      ],
    };
  },
  methods: {
    showHelp($event: Event) {
      HelpStore.drawerItems[HELP_DRAWER_ID]?.toggle($event);
    },
    async fetchHelpData() {
      // help pages are generated from src-docs/brands/<brand>/<locale>/*.md, fallback to en
      const localeLang = getCurrentLocaleLang();
      const brand = this.security?.connect?.brandName || "corvina";
      try {
        this.helpHtml = await pageHtml(localeLang, brand);
      } catch (error) {
        console.warn(`Help not available for locale ${localeLang}, fallback to en:`, error);
        this.helpHtml = await pageHtml("en", brand);
      }
    },
    onExampleButtonClick() {
      this.clickCount++;
    },
    onSelectChange(value: string | object | null) {
      // returnObject is enabled, so the select emits the whole item
      this.selectedItem = value as { title: string; value: string } | null;
    },
    currentPageChanged(newVal: number) {
      this.page = newVal;
    },
    currentItemsPerPageChanged(newVal: number) {
      this.pageSize = newVal;
      this.page = 1;
    },
  },
  computed: {
    selectItems() {
      return [
        { title: this.$t("list.optionOne"), value: "option1" },
        { title: this.$t("list.optionTwo"), value: "option2" },
        { title: this.$t("list.optionThree"), value: "option3" },
      ];
    },
    reportHeaders(): CORVINA.TABLE.TableHeaderEntries {
      return [
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "name",
          title: this.$t("list.columnName"),
          propString: "name",
          align: CORVINA.TABLE.ALIGN.START,
          sortable: false,
        },
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "version",
          title: this.$t("list.columnVersion"),
          propString: "version",
          align: CORVINA.TABLE.ALIGN.START,
          sortable: false,
        },
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "actions",
          title: this.$t("list.columnActions"),
          propString: "actions",
          align: CORVINA.TABLE.ALIGN.START,
          sortable: false,
        },
      ];
    },
    breadcrumb() {
      return {
        path: ["[| .Name |]", this.$t("list.breadcrumbYourEntity")],
        icon: "ecc-B-Dashboard",
        searchTitle: this.$t("common.searchPlaceholder"),
        disableSearch: false,
      };
    },
    filteredRepositories() {
      if (!this.search) return this.repositories;
      return this.repositories.filter((repository) =>
        repository.name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    runtimeInfo() {
      return this.security
        ? JSON.stringify({
          jwt: this.security.connect.jwt.substring(0, 10) + '...',
          organizationId: this.security.connect.organizationId,
          corvinaHost: this.security.connect.corvinaHost,
          instanceId: this.security.instanceId,
        }, null, 2)
        : {}
    }
  },
  async mounted() {
    this.security = await useSecurity();
    this.fetchHelpData();
  },
});
</script>
