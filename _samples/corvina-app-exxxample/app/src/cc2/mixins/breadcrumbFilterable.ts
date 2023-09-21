const BreadcrumbFilterableMixin = {
  methods: {
    parseQueryFilters(query, prefix, filterByItems){
      // remove every known query parameter and parse remaining as filters
      let clonedQuery = JSON.parse(JSON.stringify(query));
      //remove filters not starting with current tab prefix
      Object.keys(clonedQuery).forEach( key => {
        if(!key.startsWith(prefix)) {
          delete clonedQuery[key];
        }
      })
      let filters = new Array();
      Object.keys(clonedQuery).forEach( key => {
        let strippedKey = key.replace(prefix, '');
        let filterObj = filterByItems.find( o => o.value === strippedKey )
        let humanKey = filterObj ? filterObj.text : strippedKey;
        if(Array.isArray(clonedQuery[key])){
          clonedQuery[key].forEach( value => {
            filters.push( { value: humanKey + ': ' + value, data: { key: strippedKey, value } } );
          })
        } else {
          const value = clonedQuery[key];
          filters.push({ value: humanKey + ': ' + value, data: { key: strippedKey, value } });
        }
      })
      return filters;
    }
  }
}
export default BreadcrumbFilterableMixin;