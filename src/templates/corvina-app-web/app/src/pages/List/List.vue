<template>
  <div>
    <Breadcrumb :icon="breadcrumb.icon" :path="breadcrumb.path" :showSearchBar="!breadcrumb.disableSearch"
      :searchPlaceholder="breadcrumb.searchTitle" :searchModel="search" @update:searchModel="search = $event" />
    <v-container fluid class="container maincontainer">
      <v-row>
        <v-spacer />
        <v-col>
          <div class="text-center">
            <h1 class="col-primary">Congratulations!</h1>
            <h4 class="col-primary-dk2">You successfully created your first corvina app!</h4>
          </div>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col>
          <p>
            This is the runtime information taken thanks to connection to Corvina
            <br />
            <code>{{ runtimeInfo }}</code>
          </p>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col>
          <h3 class="text-center">Examples of components with the Corvina style:</h3>
        </v-col>
        <v-spacer />
      </v-row>
      <v-row>
        <v-spacer />
        <v-col style="display: flex; justify-content: center; align-items: center; gap: 12px;">
          <CorvinaButton
            text="Click me"
            icon="ecc-M-Home"
            tooltip="This is a tooltip"
            :variant="CORVINA.BUTTON.VARIANT.OUTLINED"
            dataQa="example-button"
            @clicked="onExampleButtonClick"
          />
          <span>Clicked {{ clickCount }} times</span>
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
            placeholder="Choose an option"
            style="min-width: 200px;"
            @update:model="selectedItem = $event"
          />
          <span v-if="selectedItem">Selected: {{ selectedItem.title }}</span>
        </v-col>
        <v-spacer />
      </v-row>
    </v-container>
    <v-container fluid class="container maincontainer">
      <v-tabs class="main-tabs fill-height mt-5" v-model="activeTab" align-tabs="title">
        <v-tab style="text-transform: capitalize">
          {{ $t("entity") }}
        </v-tab>

        <v-layout class="additionalHeader">
          <v-spacer></v-spacer>
        </v-layout>
      </v-tabs>

      <v-window disabled v-model="activeTab">
        <v-window-item>
          <div class="overflow-y-auto fill-height tabs-top-separator">
            <corvina-table
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
import { v } from "vue-router/dist/index-DFCq6eJK.js";

export default defineComponent({
  name: "List",
  data() {
    return {
      CORVINA,
      clickCount: 0,
      selectedItem: null as { title: string; value: string } | null,
      selectItems: [
        { title: "Option 1", value: "option1" },
        { title: "Option 2", value: "option2" },
        { title: "Option 3", value: "option3" },
      ],
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
      reportHeaders: [
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "name",
          title: "Name",
          propString: "name",
          align: "left",
          sortable: false,
          id: "repo-table-name",
        },
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "version",
          title: "Version",
          propString: "version",
          align: "left",
          sortable: false,
          id: "repo-table-last-uploaded-version",
        },
        {
          type: CORVINA.TABLE.CELL_TYPE.STRING,
          key: "actions",
          title: "Actions",
          propString: "actions",
          align: "left",
          sortable: false,
          id: "repo-table-actions",
        },
      ],
      breadcrumb: {
        path: ["[| .Name |]", 'Your Entity'],
        icon: "ecc-B-Dashboard",
        searchTitle: "Search...",
        disableSearch: false,
      },
    };
  },
  methods: {
    onExampleButtonClick() {
      this.clickCount++;
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
  },
});
</script>
