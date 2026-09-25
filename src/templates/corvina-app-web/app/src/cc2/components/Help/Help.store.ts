import { reactive } from "vue";

export interface IDrawerItem {
  showDrawer: boolean;
  toggle: ($event?: Event) => void;
  close: ($event?: Event) => void;
}

export const store = reactive({
  drawerItems: {} as Record<string, IDrawerItem>,
  add: (id: string) => {
    store.drawerItems[id] = {
      showDrawer: false,
      toggle: ($event) => {
        $event?.stopImmediatePropagation();
        store.drawerItems[id].showDrawer = !store.drawerItems[id].showDrawer;
      },
      close: (_$event) => {
        store.drawerItems[id].showDrawer = false;
      },
    };
  },
  remove: (id: string) => {
    delete store.drawerItems[id];
  },
});
