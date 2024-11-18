<template>
  <div>
    <Breadcrumb :path="breadcrumb.path" :icon="breadcrumb.icon" :disableSort="breadcrumb.disableSort" :currentTab="fromIndexToTabKeysValue(activeTab)"
      :searchKey="fromIndexToTabKeysValue(activeTab)" :searchModel="''" :sortQueryKeys="breadcrumb.sortQueryKeys"
      :sortingKeys="breadcrumb.sortingKeys" :searchTitle="breadcrumb.searchTitle" :disableSearch="breadcrumb.disableSearch" />
    <v-container fluid class="container maincontainer">
      <v-row>
        <v-spacer />
        <v-col>
          <div style="text-align: center;">
            <h1 style="color: var(--color-primary)">Congratulations!</h1>
            <h4 style="color: var(--color-primary-dk2)">You successfully create your first corvina app!</h4>
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
    </v-container>
    <v-container fluid class="container maincontainer">
      <p>This is an example of table with the corvina style:</p>
      <v-tabs class="main-tabs fill-height mt-5" v-model="activeTab" align-tabs="title">
        <v-tab style="text-transform: capitalize">
          {{ $t("entity") }}
        </v-tab>

        <v-layout class="additionalHeader">
          <v-spacer></v-spacer>
        </v-layout>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item>
          <div class="overflow-y-auto fill-height tabs-top-separator" infinite-wrapper>
            <v-table density="comfortable" class="main-table mt-5" data-qa="artifact-table">
              <thead>
                <tr>
                  <th class="text-left" id="repo-table-name">
                    Name
                  </th>
                  <th class="text-left" id="repo-table-last-uploaded-version">
                    Version
                  </th>
                  <th class="text-left" id="repo-table-actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="repository in [{ name: 'name1', version: 5 }, { name: 'name2', version: 92 }]"
                  :key="repository.name">
                  <td data-qa="repository-name">
                    {{ repository.name }}
                  </td>
                  <td data-qa="repository-version">{{ repository.version }}</td>
                  <td style="min-width: 90px" data-qa="repository-actions">
                    ...
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <v-row no-gutter>
            <v-col>
              <v-spacer />
            </v-col>
            <v-col cols="4">
              <v-pagination :length="Math.ceil(totalNumberOfRepositories / pageSize)" v-model="page"
                density="compact"></v-pagination>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Breadcrumb from "../../cc2/components/Breadcrumb.vue";
import { useSecurity } from "../../stores/security";

const TAB_KEYS = {
  ENTITIES: "entities",
};

export default defineComponent({
  name: "List",
  components: {
    Breadcrumb,
  },
  data() {
    return {
      security: null,
      pageSize: 10,
      page: 1,
      search: "",
      totalNumberOfRepositories: 0,
      sizeAllKey: 0,
      activeTab: 0,
      breadcrumb: {
        path: ["[| .Name |]", 'Your Entity'],
        icon: "ecc-B-Dashboard",
        searchTitle: "Search...",
        sortQueryKeys: {
          [TAB_KEYS.ENTITIES]: "sortByRepositories",
        },
        sortingKeys: {
          [TAB_KEYS.ENTITIES]: {
            name: "Sort by name",
            creationDate: "Sort by uploaded date",
          },
        },
        disableSearch: false,
        disableSort: true,
      },
    };
  },
  methods: {
    fromIndexToTabKeysValue(index: number) {
      return Object.values(TAB_KEYS)[index];
    },
  },
  computed: {
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
