const levelgraph = require('levelgraph');
const leveljs = require('level-js');
const levelup = require('levelup');
const levelgraphJSONLD = require('levelgraph-jsonld');
const levelgraphN3 = require('levelgraph-n3');

export function install(Vue, options) {
  const factory = function (location) { return new leveljs(location) };
  // TODO: should db_name default?
  let db_name = options.name || 'levelgraph';
  Vue.prototype.$db = levelgraphN3(
    levelgraphJSONLD(
      levelgraph(
        levelup(db_name, {db: factory})
      )
    )
  );

  Vue.mixin({
    methods: {
      getInto(keypath, filter) {
        let self = this;
        // avoids getting {}...which returns *everything*
        if (Object.keys(filter).length > 0) {
          self.$db.get(filter, (err, rv) => {
            if (err) throw err;
            else {
              self[keypath] = rv;
            }
          });
        }
      }
    }
  });
};
